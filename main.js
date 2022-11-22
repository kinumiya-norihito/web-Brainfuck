window.onload = () => {
	let
		bftape,
		tp,
		bfcode,
		cp,
		lv,
		strin,
		intervalId,
		ac,
		is_focus = false,
		is_meta = false;
	const
		//定数など
		//element
		maxRunInput = document.getElementById('maxRunInput'),
		bfcodeArea = document.getElementById('bfcodeArea'),
		outArea = document.getElementById('outArea'),
		showInfoArea = document.getElementById('showInfoArea'),
		runButton = document.getElementById('runButton'),
		stepButton = document.getElementById('stepButton'),
		resetButton = document.getElementById('resetButton'),
		cycleButton = document.getElementById('cycleButton'),
		cpsInput = document.getElementById('cpsInput'),
		nocInput = document.getElementById('nocInput'),
		novcInput = document.getElementById('novcInput'),
		bfco = document.getElementById('bfco'),
		defaultInput = document.getElementById('defaultInput'),
		countElem = document.getElementById('count'),
		//関数

		showInfo = () => {
			//ここに色々書く
			showInfoArea.innerHTML = '';
			for (let j = 0; j < bfcode.length; j++) {
				showInfoArea.innerHTML += (j == cp - 1 ? '<b>' : '') + bfcode[j].replace(/\&|\"|\'|\<|\>/g, (match) => { switch (match) { case '&': return '&amp;'; case '"': return '&quot;'; case '\'': return '&#039;'; case '<': return '&lt;'; case '>': return '&gt;'; } }) + (j == cp - 1 ? '</b>' : '') + (j % 64 == 63 ? '<br/>' : '');
			}
			showInfoArea.innerHTML += '<br/><br/>[';
			for (let j = 0; j < bftape.length; j++) {
				showInfoArea.innerHTML += (j ? ',' : '') + (j == tp ? '<b>' : '') + (bftape[j] + 256).toString(16).substr(1, 2) + (j == tp ? '</b>' : '');
			}
			showInfoArea.innerHTML += `]`;
			countElem.innerHTML = ac;
		},
		run = (n) => {
			n = n || +maxRunInput.value;
			const f = () => {
				switch (bfcode[cp]) {
					case '[':
						lv++;
						break;
					case ']':
						lv--;
				}
			};
			for (let i = 0; i < n; i++) {
				if (tp < 0) {
					showInfo();
					return;
				}
				if (!bfcode[cp]) {
					showInfo();
					return;
				}
				bftape[tp] = bftape[tp] || 0;
				switch (bfcode[cp]) {
					case '+':
						bftape[tp]++;
						bftape[tp] %= 256;
						break;
					case '-':
						bftape[tp]--;
						if (bftape[tp] < 0) bftape[tp] += 256;
						break;
					case '>':
						tp++;
						break;
					case '<':
						tp--;
						break;
					case '[':
						if (bftape[tp] == 0) {
							lv++;
							while (lv > 0) {
								if (bfcode[++cp]) {
									f();
								}
								else {
									showInfo();
									return;
								}
							}
						}
						break;
					case ']':
						lv--;
						while (lv < 0) {
							if (--cp > 0) {
								f();
							}
							else {
								showInfo();
								return;
							}
						}
						cp--;
						break;
					case '.':
						outArea.value = outArea.value.replace(/%/g, '%25');
						outArea.value += '%' + ((256 + bftape[tp]).toString(16).substr(1, 2));
						try {
							outArea.value = decodeURIComponent(outArea.value);
						}
						catch (e) { }
						break;
					case ',':
						while (!strin) {
							strin += prompt('\'%NN\'とすることで0-255までの数値も入力可能\nただし\'%\'を入力する場合は\'%25\'と入力') || '';
							strin = encodeURI(strin).replace(/%25/g, '%');
						}
						if (strin[0] == '%') {
							bftape[tp] = parseInt(strin.substr(1, 2), 16);
							strin = strin.substr(3);
						}
						else {
							bftape[tp] = strin.charCodeAt(0);
							strin = strin.substr(1);
						}
						break;
					case ':':
						cp++;
						intervalId && clearInterval(intervalId);
						showInfo();
						return;
				}
				ac++;
				cp++;
			}
			showInfo();
		},
		reset = (n) => {
			switch (n) {
				case 1:
					bfcodeArea.value = bfcode.replace(/[^+,\-.<>\[\]:]+/g, '');
					break;
			}
			tp = cp = lv = ac = 0;
			bftape = new Array();
			bfcode = bfcodeArea.value;
			strin = defaultInput.value;
			outArea.value = '';
			showInfoArea.innerHTML = '';
			nocInput.innerHTML = bfcode.length;
			novcInput.innerHTML = bfcode.replace(/[^+,\-.<>\[\]]+/g, '').length;
			countElem.innerHTML = '0';
			intervalId && clearInterval(intervalId);
			showInfo();
		},
		run_constant = () => {
			let i = 0;
			const
				lim = +maxRunInput.value,
				cps = +cpsInput.value;

			intervalId && clearInterval(intervalId);
			intervalId = setInterval(() => {
				run(1);
				if (i == lim) {
					clearInterval(intervalId);
				}
			}, cps);
		};
	reset();

	//イベント
	maxRunInput.addEventListener('blur', () => {
		const x = +maxRunInput.value || 0;
		maxRunInput.value = x < 1 ? 1000000 : Math.floor(x);
	});
	cpsInput.addEventListener('blur', () => {
		const x = +cpsInput.value || 0;
		cpsInput.value = x < 10 ? 10 : Math.floor(x);
		cycleButton.innerHTML = `${x}ミリ秒ごとに実行(p)`;
	});
	bfcodeArea.addEventListener('change', () => {
		reset();
	});
	runButton.addEventListener('click', () => {
		run();
	});
	stepButton.addEventListener('click', () => {
		run(1);
	});
	resetButton.addEventListener('click', () => {
		reset();
	});
	bfco.addEventListener('click', () => {
		reset(1);
	});
	cycleButton.addEventListener('click', () => {
		run_constant();
	});

	bfcodeArea.addEventListener('focus', (e) => {
		is_focus = true;
	});
	bfcodeArea.addEventListener('blur', (e) => {
		is_focus = false;
	});
	defaultInput.addEventListener('focus', (e) => {
		is_focus = true;
	});
	defaultInput.addEventListener('blur', (e) => {
		is_focus = false;
	});
	cpsInput.addEventListener('focus', (e) => {
		console.log(e);
		is_focus = true;
	});
	cpsInput.addEventListener('blur', (e) => {
		console.log(e);
		is_focus = false;
	});
	maxRunInput.addEventListener('focus', (e) => {
		is_focus = true;
	});
	maxRunInput.addEventListener('blur', (e) => {
		is_focus = false;
	});
	window.addEventListener('keydown', (e) => {
		if (!is_focus && !is_meta) {
			switch (e.key) {
				case 'c':
					reset();
					break;
				case 'p':
					run_constant()
					break;
				case 'r':
					run();
					break;
				case 's':
					run(1);
					break;
				case 'Meta':
					is_meta = true;
					break;
			}
		}
	});
	window.addEventListener('keyup', () => {
		is_meta = false;
	});
};
