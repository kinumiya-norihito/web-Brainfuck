const
	SIZE = 256;

class Status {
	static None = Symbol(0);
	static Complete = Symbol(1);
	static Break = Symbol(2);
	static Error = Symbol(3);
}

class BrainfuckInterpreter {
	#code;
	#pc;
	#tape;
	#tp;
	#tapePassed;

	#inputBytes;
	#output;
	#ruiString;

	#interpretedCount;
	#status;
	#latestLog;

	constructor(code, input) {
		this.#code = code;
		this.#pc = 0;
		this.#tape = [0];
		this.#tp = 0;
		this.#tapePassed = [0];

		this.#createInputBytes(input);
		this.#output = "";
		this.#ruiString = "";

		this.#interpretedCount = 0;
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
			switch (this.#code[this.#pc]) {
				case '+':
					this.#tapePassed[this.#tp]++;
					this.#tape[this.#tp] = (this.#tape[this.#tp] + 1) % 256;
					break;
				case '-':
					this.#tapePassed[this.#tp]++;
					this.#tape[this.#tp] = (this.#tape[this.#tp] + 255) % 256;
					break;
				case '>':
					this.#tp++;
					if (this.#tape[this.#tp] == undefined) {
						this.#tape[this.#tp] = 0;
						this.#tapePassed[this.#tp] = 0;
					}
					break;
				case '<':
					this.#tp--;
					if (this.#tp < 0) {
						this.#createLog("illegal index", Status.Error);
						return;
					}
					break;
				case '[':
					this.#tapePassed[this.#tp]++;
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
					this.#tapePassed[this.#tp]++;
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
					this.#tapePassed[this.#tp]++;
					this.#ruiString += `%${(256 + this.#tape[this.#tp]).toString(16).substring(1, 3)}`;
					break;
				case ',':
					this.#tapePassed[this.#tp]++;
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
					this.#createLog("break", Status.Break);
					return;
			}
			if (!this.#code[this.#pc]) {
				this.#createLog("complete", Status.Complete);
				return "complete";
			}
			this.#pc++;
			this.#interpretedCount++;
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

	get tapaPassed() {
		return this.#tapePassed;
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

	get interpretedCount() {
		if (this.#status == Status.Complete)
			return this.#interpretedCount;
		return undefined;
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
		bool,
		numberBase;

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
		interpretedCountElement = document.getElementById("interpretedCount"),
		//config
		executionLimitInputElement = document.getElementById("executionLimitInput"),
		cpmsInputElement = document.getElementById("cpmsInput"),
		deleteNonCommandCharButtonElement = document.getElementById("deleteNonCommandCharButton"),
		numberBaseElement = document.getElementById("numberBase"),
		//test
		testJSONTextareaElement = document.getElementById("testJSONTextarea"),
		doTestButtonElement = document.getElementById("doTestButton"),
		testTableBodyElement = document.getElementById("testTableBody"),
		/*
			functions
		*/
		reset = () => {
			reset_exec();
			reset_config();
			stopInterval();
		},
		reset_exec = () => {
			code = codeTextareaElement.value;
			input = inputTextareaElement.value;
			interpreter = new BrainfuckInterpreter(code, input);
			testTableBodyElement.innerHTML = "";
		},
		reset_config = () => {
			executionLimit = getValue(executionLimitInputElement, 1);
			cpms = getValue(cpmsInputElement, 10);
			numberBase = numberBaseElement.value;
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
				case Status.Break:
					outputTextareaElement.className = "pause";
					break;
				case Status.Error:
					outputTextareaElement.className = "error";
					break;
			}
			outputTextareaElement.value = interpreter.status == Status.Error ? interpreter.latestLog : interpreter.output;
			//input
			inputShowAreaElement.innerHTML = "";
			for (let i = 0; i < interpreter.inputBytes.length; i++) {
				inputShowAreaElement.innerHTML += `${i ? " " : "<span class=\"target\">"}${toBaseString(interpreter.inputBytes[i])}${i ? "" : "</span>"}`;
			}
			//tape
			tapeShowAreaElement.innerHTML = "";
			for (let i = 0; i < interpreter.tape.length; i++) {
				const b0 = i === interpreter.tp;
				const b1 = interpreter.tapaPassed[i];
				tapeShowAreaElement.innerHTML += `${i ? " " : ""}${b1 == 0 ? "<span class=\"unused\">" : ""}${b0 ? "<span class=\"target\">" : ""}${toBaseString(interpreter.tape[i])}${b0 == 0 ? "</span>" : ""}${b1 ? "</span>" : ""}`;
			}
			//code
			codeShowAreaElement.innerHTML = `${interpreter.code.substring(0, interpreter.pc)}<span class="target">${interpreter.code.substring(interpreter.pc, interpreter.pc + 1)}</span>${interpreter.code.substring(interpreter.pc + 1)}<br/><br/>`;
			//interpreted count
			(x => interpretedCountElement.innerHTML = x == undefined ? "undecided" : x)(interpreter.interpretedCount);

		},
		getValue = (element, min) => {
			return element.value < min ? min : element.value;
		},
		startInterval = () => {
			if (!bool) {
				executeCycleButtonElement.innerHTML = "pause execution";
				intervalObj = setInterval(intervalFunction, cpms);
				bool = true;
			}
		},
		stopInterval = () => {
			if (bool) {
				executeCycleButtonElement.innerHTML = `execute per ${cpms}ms`;
				clearInterval(intervalObj);
				bool = false;
			}
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
			let testCount = 0, passTestCount = 0;
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
					passTestCount++;
				}
				else {
					testResultTd.className = "testTableTd error";
					if (testInterpreter.latestLog == "complete") testResultTd.innerHTML = "wrong output";
				}
				testTableBodyElement.append(testTableTr);
				testCount++;
			}
		},
		deleteNonCommandChar = (str) => {
			return str.replace(/[^<>\[\],.+\-:]/g, "");
		},
		toBaseString = (x) => {
			return ((numberBase ** ((SIZE - 1).toString(numberBase).length)) + x).toString(numberBase).substring(1, 1 + (SIZE - 1).toString(numberBase).length);
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
	numberBaseElement.addEventListener("change", () => {
		reset_config();
	});
	executionLimitInputElement.addEventListener("change", () => {
		if (executionLimitInputElement.value < 1) executionLimitInputElement.value = executionLimit;
		reset_config();
	});
	cpmsInputElement.addEventListener("change", () => {
		if (cpmsInputElement.value < 10) cpmsInputElement.value = cpms;
		if (bool) {
			stopInterval();
			reset_config();
			startInterval();
		}
		else {
			reset_config();
		}
	});
	deleteNonCommandCharButtonElement.addEventListener("click", () => {
		if (confirm("Are you sure you want to run it?\nThis operation cannot be undone.")) {
			codeTextareaElement.value = deleteNonCommandChar(codeTextareaElement.value);
		}
	});

	//test
	doTestButtonElement.addEventListener("click", () => {
		test(testJSONTextareaElement.value);
	});
};