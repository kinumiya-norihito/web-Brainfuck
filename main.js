window.onload = () => {
	let
	bftape,
	tp,
	bfcode,
	cp,
	lv,
	strin;
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
	//関数
	run = (n) => {
		const f = () => {
			switch(bfcode[cp]){
				case '[':
					lv++;
					break;
				case ']':
					lv--;
			}
		};
		for(let i = 0; i < n; i++){
			if(!bfcode[cp])return;
			bftape[tp] = bftape[tp] || 0;
			switch(bfcode[cp]){
				case '+':
					bftape[tp]++;
					bftape[tp]%=256;
					break;
				case '-':
					bftape[tp]--;
					if(bftape[tp] < 0)bftape[tp]+=256;
					break;
				case '>':
					tp++;
					break;
				case '<':
					tp--;
					break;
				case '[':
					if(bftape[tp]==0){
						lv++;
						while(lv>0){
							if(bfcode[++cp]){
								f();
							}
							else{
								return;
							}
						}
					}
					break;
				case ']':
					lv--;
					while(lv<0){
						if(--cp>0){
							f();
						}
						else{
							return;
						}
					}
					cp--;
					break;
				case '.':
					outArea.value = outArea.value.replace(/%/g,'%25');
					outArea.value += '%'+((256+bftape[tp]).toString(16).substr(1,2));
					try{
						outArea.value = decodeURIComponent(outArea.value);
					}
					catch(e){}
					break;
				case ',':
					while(!strin){
						strin += prompt('\'%NN\'とすることで0-255までの数値も入力可能\nただし\'%\'を入力する場合は\'%25\'と入力') || '';
						strin = encodeURI(strin).replace(/%25/g,'%');
					}
					if(strin[0]=='%'){
						bftape[tp] = parseInt(strin.substr(1,2),16);
						strin = strin.substr(3);
					}
					else{
						bftape[tp] = strin.charCodeAt(0);
						strin = strin.substr(1);
					}
					break;
				case ':':
					cp++;
					return;
			}
			cp++;
		}
	},
	showInfo = () => {
		//ここに色々書く
		showInfoArea.innerHTML = '';
		for(let j = 0; j < bfcode.length; j++){
			showInfoArea.innerHTML += (j==cp-1?'<b>':'')+bfcode[j]+(j==cp-1?'</b>':'')+(j%64==63?'<br/>':''); 
		}
		showInfoArea.innerHTML += '<br/>[';
		for(let j = 0; j < bftape.length; j++){
			showInfoArea.innerHTML += (j?',':'')+(j==tp?'<b>':'')+(bftape[j]+256).toString(16).substr(1,2)+(j==tp?'</b>':'');
		}
		showInfoArea.innerHTML += `]`;
	},
	reset = () => {
		tp = cp = lv = 0;
		bftape = new Array();
		bfcode = bfcodeArea.value;
		strin = '';
		outArea.value = '';
		showInfoArea.innerHTML = '';
		showInfo();
	};

	reset();

	//イベント
	maxRunInput.addEventListener('blur',()=>{
		const x = +maxRunInput.value || 0;
		maxRunInput.value = x<1?1000000:Math.floor(x);
	});
	bfcodeArea.addEventListener('change',()=>{
		reset();
	});
	runButton.addEventListener('click',()=>{
		run(+maxRunInput.value);
		showInfo();
	});
	stepButton.addEventListener('click',()=>{
		run(1);
		showInfo();
	});
	resetButton.addEventListener('click',()=>{
		reset();
	});
};
