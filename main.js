class Status {
	static None = Symbol(0);
	static Complete = Symbol(1);
	static Stop = Symbol(2);
	static Error = Symbol(3);
}

class BrainfuckInterpreter {
	#code;
	#pc;
	#tape;
	#tp;

	#inputBytes;
	#output;
	#ruiString;

	#executionCount;
	#status;
	#latestLog;

	constructor(code, input) {
		this.#code = code;
		this.#pc = -1;
		this.#tape = [0];
		this.#tp = 0;

		this.#createInputBytes(input);
		this.#output = "";
		this.#ruiString = "";

		this.#executionCount = 0;
		this.#status = Status.None;
	}

	exexute(lim) {
		if (this.#status == Status.Error) return;
		lim = lim || 1;
		let lv = 0;
		const lvManage = () => {
			switch (this.#code[this.#pc]) {
				case '[':
					lv++;
					break;
				case ']':
					lv--;
					break;
			}
		};

		for (let i = 0; i < lim; i++) {
			this.#pc++;
			this.#executionCount++;
			switch (this.#code[this.#pc]) {
				case '+':
					this.#tape[this.#tp] = (this.#tape[this.#tp] + 1) % 256;
					break;
				case '-':
					this.#tape[this.#tp] = (this.#tape[this.#tp] + 255) % 256;
					break;
				case '>':
					this.#tp++;
					if (this.#tape[this.#tp] == undefined) {
						this.#tape[this.#tp] = 0;
					}
					break;
				case '<':
					this.#tp--;
					break;
				case '[':
					if (this.#tape[this.#tp] == 0) {
						lv++;
						while (lv) {
							this.#pc++;
							if (!this.#code[this.#pc]) {
								this.#createLog("out of range", Status.Error);
								return;
							}
							lvManage();
						}
					}
					break;
				case ']':
					lv--;
					while (lv) {
						this.#pc--;
						if (this.#pc < 0) {
							this.#createLog("illegal index", Status.Error);
							return;
						}
						lvManage();
					}
					this.#pc--;
					break;
				case '.':
					this.#ruiString += `%${(256 + this.#tape[this.#tp]).toString(16).substring(1, 3)}`;
					break;
				case ',':
					if (this.inputBytes.length > 0) {
						this.#tape[this.#tp] = this.inputBytes[0];
						this.inputBytes.shift();
					}
					else {
						this.#createLog("insufficient input", Status.Error);
						return;
					}
					break;
				case ':':
					this.#createLog("stop", Status.Stop);
					return;
			}
			if (!this.#code[this.#pc]) {
				this.#createLog("complete", Status.Complete);
				return "complete";
			}
		}
		this.#createLog("execution limit", Status.None);
		return;
	}

	#createLog(log, status) {
		this.#status = status;
		this.#latestLog = log;
	}

	#createInputBytes(input) {
		this.#inputBytes = [];
		input = encodeURI(input || "");
		while (input) {
			if (input[0] == '%') {
				this.#inputBytes[this.#inputBytes.length] = parseInt(input.substring(1, 3), 16);
				input = input.substring(3);
			}
			else {
				this.#inputBytes[this.#inputBytes.length] = input[0].charCodeAt();
				input = input.substring(1);
			}
		}
	}

	get code() {
		return this.#code;
	}
	get pc() {
		return this.#pc;
	}
	get tape() {
		return this.#tape;
	}
	get tp() {
		return this.#tp;
	}

	get inputBytes() {
		return this.#inputBytes;
	}

	get output() {
		try {
			this.#output = decodeURIComponent(this.#ruiString);
		}
		catch { }
		return this.#output;
	}

	get executionCount() {
		return executionCount;
	}
	get status() {
		return this.#status;
	}

	get latestLog() {
		return this.#latestLog;
	}
}

window.onload = () => {
	let
		code,
		interpreter,
		executionLimit,
		cpms,
		intervalObj,
		bool;

	const
		/*
			elements
		*/
		//code
		codeTextareaElement = document.getElementById("codeTextarea"),
		//io
		inputTextareaElement = document.getElementById("inputTextarea"),
		outputTextareaElement = document.getElementById("outputTextarea"),
		//control
		executeButtonElement = document.getElementById("executeButton"),
		stepExecuteButtonElement = document.getElementById("stepExecuteButton"),
		executeCycleButtonElement = document.getElementById("executeCycleButton"),
		resetButtonElement = document.getElementById("resetButton"),
		//information
		inputShowAreaElement = document.getElementById("inputShowArea"),
		tapeShowAreaElement = document.getElementById("tapeShowArea"),
		codeShowAreaElement = document.getElementById("codeShowArea"),
		//config
		executionLimitInputElement = document.getElementById("executionLimitInput"),
		cpmsInputElement = document.getElementById("cpmsInput"),
		//test
		testJSONTextareaElement = document.getElementById("testJSONTextarea"),
		doTestButtonElement = document.getElementById("doTestButton"),
		testTableBodyElement = document.getElementById("testTableBody"),
		/*
			functions
		*/
		reset = () => {
			stopInterval();
			code = codeTextareaElement.value;
			input = inputTextareaElement.value;
			interpreter = new BrainfuckInterpreter(code, input);

			executionLimit = getValue(executionLimitInputElement, 1);
			cpms = getValue(cpmsInputElement, 10);

			bool = false;
			/*show*/
			executeCycleButtonElement.innerHTML = `execute per ${cpms}ms`;
			//test
			testTableBodyElement.innerHTML = "";
			show_information();
		},
		show_information = () => {
			//output
			switch (interpreter.status) {
				case Status.None:
					outputTextareaElement.className = "";
					break;
				case Status.Complete:
					outputTextareaElement.className = "complete";
					break;
				case Status.Stop:
					outputTextareaElement.className = "stop";
					break;
				case Status.Error:
					outputTextareaElement.className = "error";
					break;
			}
			outputTextareaElement.value = interpreter.status == Status.Error ? interpreter.latestLog : interpreter.output;
			//input
			inputShowAreaElement.innerHTML = "";
			for (let i = 0; i < interpreter.inputBytes.length; i++) {
				inputShowAreaElement.innerHTML += `${i ? " " : "<span class=\"target\">"}${(256 + interpreter.inputBytes[i]).toString(16).substring(1, 3)}${i ? " " : "</span>"}`;
			}
			//tape
			tapeShowAreaElement.innerHTML = "";
			for (let i = 0; i < interpreter.tape.length; i++) {
				const bool = i === interpreter.tp;
				tapeShowAreaElement.innerHTML += `${i ? " " : ""}${bool ? "<span class=\"target\">" : ""}${(256 + interpreter.tape[i]).toString(16).substring(1, 3)}${bool ? "</span>" : ""}`;
			}
			//code
			codeShowAreaElement.innerHTML = `${interpreter.code.substring(0, interpreter.pc)}<span class="target">${interpreter.code.substring(interpreter.pc, interpreter.pc + 1)}</span>${interpreter.code.substring(interpreter.pc + 1)}<br/><br/>`;
		},
		getValue = (element, min) => {
			return element.value < min ? min : element.value;
		},
		startInterval = () => {
			executeCycleButtonElement.innerHTML = "stop execution";
			intervalObj = setInterval(intervalFunction, cpms);
			bool = true;
		},
		stopInterval = () => {
			executeCycleButtonElement.innerHTML = `execute per ${cpms}ms`;
			clearInterval(intervalObj);
			bool = false;
		},
		intervalFunction = () => {
			interpreter.exexute(1);
			show_information();
			if (interpreter.status != Status.None) {
				stopInterval();
			}
		},
		test = (testListJSON) => {
			testTableBodyElement.innerHTML = "";
			const testList = JSON.parse(testListJSON);
			for (const testObj of testList) {
				const
					testTableTr = document.createElement("div"),
					testInputTd = document.createElement("div"),
					testOutputTd = document.createElement("div"),
					testResultTd = document.createElement("div");
				//add element
				testTableTr.append(testInputTd);
				testTableTr.append(testOutputTd);
				testTableTr.append(testResultTd);
				//set class
				testTableTr.className = "testTableTr";
				testInputTd.className = testOutputTd.className = "testTableTd";
				//set text
				testInputTd.innerHTML = testObj.input;
				testOutputTd.innerHTML = testObj.output;
				//do test
				const testInterpreter = new BrainfuckInterpreter(code, testObj.input);
				testInterpreter.exexute(executionLimit);
				testResultTd.innerHTML = testInterpreter.latestLog;
				if (testInterpreter.output === testObj.output) {
					testResultTd.className = "testTableTd complete";
				}
				else {
					testResultTd.className = "testTableTd error";
					if (testInterpreter.latestLog == "complete") testResultTd.innerHTML = "wrong output";
				}
				testTableBodyElement.append(testTableTr);
			}
		};
	reset();

	//control
	executeButtonElement.addEventListener("click", () => {
		interpreter.exexute(executionLimit);
		show_information();
	});
	stepExecuteButtonElement.addEventListener("click", () => {
		interpreter.exexute(1);
		show_information();
	});
	executeCycleButtonElement.addEventListener("click", () => {
		bool ? stopInterval() : startInterval();
	});
	resetButtonElement.addEventListener("click", () => {
		reset();
	});

	//config
	executionLimitInputElement.addEventListener("blur", () => {
		if (executionLimitInputElement.value < 1) executionLimitInputElement.value = 10000;
	});
	cpmsInputElement.addEventListener("blur", () => {
		if (cpmsInputElement.value < 10) cpmsInputElement.value = 10;
	});

	//test
	doTestButtonElement.addEventListener("click", () => {
		test(testJSONTextareaElement.value);
	});
};