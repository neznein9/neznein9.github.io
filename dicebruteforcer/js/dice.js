

setInterval(iterateSimulation);
setInterval(updateUI, 100);

const ACTIVATIONS_PER_TICK = 100;	//  This is the 'throttle' - set this lower for old/mobile cpus

const ANGEL_MAT = 6;
const ANGEL_POW = 14;
const SCYTHEAN_MAT = 6;
const SCYTHEAN_POW = 17;
const JUG_DEF = 10;
const JUG_ARM = 20;
const JUG_HALF_ARM = Math.ceil(JUG_ARM / 2);

//  function shortcuts
const floor = Math.floor;
const rand = Math.random;	//  TODO: Faster with a different RNG? Mersenne twister?

var dom = {
	"fdtitle": document.getElementById("fdtitle"),
	"angelHead": document.getElementById("angelHead"),
	"angel1": document.getElementById("angel1"),
	"angel2": document.getElementById("angel2"),
	"angel3": document.getElementById("angel3"),
	"scythHead": document.getElementById("scythHead"),
	"scyth1": document.getElementById("scyth1"),
	"scyth2": document.getElementById("scyth2"),
	"scyth3": document.getElementById("scyth3"),
	"scyth4": document.getElementById("scyth4"),
	"scyth5": document.getElementById("scyth5"),
	"scyth6": document.getElementById("scyth6"),
	"1d6": document.getElementById("1d6"),
	"2d6": document.getElementById("2d6"),
	"3d6": document.getElementById("3d6"),
}

var bars = [
	/* Include an empty 0 index, sloppy memory, cleaner logic */,
	document.getElementById("ones"),
	document.getElementById("twos"),
	document.getElementById("threes"),
	document.getElementById("fours"),
	document.getElementById("fives"),
	document.getElementById("sixes")
];

var activations = 0;
var angelToHit = [0, 0, 0, 0, 0];
var angelDamage = [0, 0, 0, 0, 0];

var angelCripples = [0, 0, 0, 0, 0];
var damageGrid = [0, 0, 0, 0, 0, 0];

var scythToHit = [0, 0, 0, 0, 0, 0, 0];
var scythDamage = [0, 0, 0, 0, 0, 0, 0];
var scythCripples = [0, 0, 0, 0, 0, 0, 0];

var oneD6Sum = 0;
var twoD6Sum = 0;
var threeD6Sum = 0;

var oneD6Rolls = 0;
var twoD6Rolls = 0;
var threeD6Rolls = 0;

var totalDiceRolled = 0;
var rolls = [0, 0, 0, 0, 0, 0, 0];			//  yup, 7 indexes, just ignore [0] - sloppy jalopy!

function iterateSimulation() {
	for(let i = ACTIVATIONS_PER_TICK; i > 0; --i){
	++activations;
	activateAngelius();
	activateScythean();
	}
}

function activateAngelius(){
	//  Reset the damage grid
	damageGrid[0] = damageGrid[1] = damageGrid[2] = damageGrid[3] = damageGrid[4] = damageGrid[5] = 0;

	//  First attack: charge with armor-piercing
	let toHit = get2d6();
	if(toHit + ANGEL_MAT >= JUG_DEF){
		++angelToHit[1];
		let dam = (get3d6() + ANGEL_POW) - JUG_HALF_ARM;
		angelDamage[1] += dam;		//  dice + 4 should always be above zero
		applyDamage(dam, get1d6());
		angelCripples[1] += crippledSystem();
	}

	//  Second attack: boosted damage
	toHit = get2d6();
	if(toHit + ANGEL_MAT >= JUG_DEF){
		++angelToHit[2];
		dam = (get3d6() + ANGEL_POW) - JUG_ARM;

		if(dam < 1) dam = 0;
		angelDamage[2] += dam;

		applyDamage(dam, get1d6());
	}
	angelCripples[2] += crippledSystem();

	//  Third attack:
	toHit = get2d6();
	if(toHit + ANGEL_MAT >= JUG_DEF){
		++angelToHit[3];
		dam = (get2d6() + ANGEL_POW) - JUG_ARM;

		if(dam < 1) dam = 0;
		angelDamage[3] += dam;

		applyDamage(dam, get1d6());
	}
	angelCripples[3] += crippledSystem();
}

function activateScythean(){
	//  Reset the damage grid
	damageGrid[0] = damageGrid[1] = damageGrid[2] = damageGrid[3] = damageGrid[4] = damageGrid[5] = 0;

	for(let j = 1; j < 7; ++j){
		let toHit = get2d6();
		if(toHit + SCYTHEAN_MAT >= JUG_DEF){
			++scythToHit[j];
			let dam = (get2d6() + SCYTHEAN_POW) - JUG_ARM;

			if(dam > 0){
				scythDamage[j] += dam;
				applyDamage(dam, get1d6());
			}
		}
		scythCripples[j] += crippledSystem();
	}
}

function updateUI(){
	for(let i = 1; i < 7; ++i){
		bars[i].style.width = (100 * (rolls[i] / totalDiceRolled)) + "%";
		bars[i].innerHTML = i + ":&nbsp;" + (100 * (rolls[i] / totalDiceRolled)).toFixed(1) + "%";
	}

	let cumulativeDamage = (angelDamage[1] / activations);

	dom["fdtitle"].innerHTML = "Frequency distribution: "
		+ (totalDiceRolled.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + " D6 rolls";

	dom["angelHead"].innerHTML = "Angelius: "
		+ (activations.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + " activations";

	dom["angel1"].innerHTML =
		(100 * angelToHit[1] / activations).toFixed(1) + "% hit, "
		+ (angelDamage[1] / activations).toFixed(1) + " average damage, "
		+ (100 * angelCripples[1] / activations).toFixed(1) + "% chance to cripple a system.";

	cumulativeDamage += (angelDamage[2] / activations);
	dom["angel2"].innerHTML =
		(100 * angelToHit[2] / activations).toFixed(1) + "% hit, "
		+ (angelDamage[2] / activations).toFixed(1) + " average damage, "
		+ cumulativeDamage.toFixed(1) + " cumulative damage, "
		+ (100 * angelCripples[2] / activations).toFixed(1) + "% cumulative chance to cripple a system.";

	cumulativeDamage += (angelDamage[3] / activations);
	dom["angel3"].innerHTML =
		(100 * angelToHit[3] / activations).toFixed(1) + "% hit, "
		+ (angelDamage[3] / activations).toFixed(1) + " average damage, "
		+ cumulativeDamage.toFixed(1) + " cumulative damage, "
		+ (100 * angelCripples[3] / activations).toFixed(1) + "% cumulative chance to cripple a system.";

	dom["scythHead"].innerHTML = "Scythean: "
		+ (activations.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + " activations";

	cumulativeDamage = scythDamage[1] / activations;
	dom["scyth1"].innerHTML = (100 * scythToHit[1] / activations).toFixed(1) + "% hit, "
		+ (scythDamage[1] / activations).toFixed(1) + " average damage, "
		+ (100 * scythCripples[1] / activations).toFixed(1) + "% chance to cripple a system.";

	cumulativeDamage += scythDamage[2] / activations;
	dom["scyth2"].innerHTML = (100 * scythToHit[2] / activations).toFixed(1) + "% hit, "
		+ (scythDamage[2] / activations).toFixed(1) + " average damage, "
		+ cumulativeDamage.toFixed(1) + " cumulative damage, "
		+ (100 * scythCripples[2] / activations).toFixed(1) + "% cumulative chance to cripple a system.";

	cumulativeDamage += scythDamage[3] / activations;
	dom["scyth3"].innerHTML = (100 * scythToHit[3] / activations).toFixed(1) + "% hit, "
		+ (scythDamage[3] / activations).toFixed(1) + " average damage, "
		+ cumulativeDamage.toFixed(1) + " cumulative damage, "
		+ (100 * scythCripples[3] / activations).toFixed(1) + "% cumulative chance to cripple a system.";

	cumulativeDamage += scythDamage[4] / activations;
	dom["scyth4"].innerHTML = (100 * scythToHit[4] / activations).toFixed(1) + "% hit, "
		+ (scythDamage[4] / activations).toFixed(1) + " average damage, "
		+ cumulativeDamage.toFixed(1) + " cumulative damage, "
		+ (100 * scythCripples[4] / activations).toFixed(1) + "% cumulative chance to cripple a system.";

	cumulativeDamage += scythDamage[5] / activations;
	dom["scyth5"].innerHTML = (100 * scythToHit[5] / activations).toFixed(1) + "% hit, "
		+ (scythDamage[5] / activations).toFixed(1) + " average damage, "
		+ cumulativeDamage.toFixed(1) + " cumulative damage, "
		+ (100 * scythCripples[5] / activations).toFixed(1) + "% cumulative chance to cripple a system.";

	cumulativeDamage += scythDamage[6] / activations;
	dom["scyth6"].innerHTML = (100 * scythToHit[6] / activations).toFixed(1) + "% hit, "
		+ (scythDamage[6] / activations).toFixed(1) + " average damage, "
		+ cumulativeDamage.toFixed(1) + " cumulative damage, "
		+ (100 * scythCripples[6] / activations).toFixed(1) + "% cumulative chance to cripple a system.";

	dom["1d6"].innerHTML = "Rolled 1d6 " + (oneD6Rolls.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
		+ " times: " + (oneD6Sum / oneD6Rolls).toFixed(1) + " average";

	dom["2d6"].innerHTML = "Rolled 2d6 " + (twoD6Rolls.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
		+ " times: " + (twoD6Sum / twoD6Rolls).toFixed(1) + " average";

	dom["3d6"].innerHTML = "Rolled 3d6 " + (threeD6Rolls.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
		+ " times: " + (threeD6Sum / threeD6Rolls).toFixed(1) + " average";
}

function applyDamage(amount, column){
	for(let c = column - 1; c < column + 5; ++c){
		let damCapacity = 6;
		if(c % 6 == 0 || c % 6 == 5){				//  remember end columns wrap around
			damCapacity = 5 - damageGrid[(c % 6)];

			if(amount <= damCapacity) {
				damageGrid[(c % 6)] += amount;
				return;
			} else {
				damageGrid[(c % 6)] = 5;
				amount -= damCapacity;
			}
		} else {
			damCapacity = 6 - damageGrid[(c % 6)];

			if(amount <= damCapacity) {
				damageGrid[(c % 6)] += amount;
				return;
			} else {
				damageGrid[(c % 6)] = 6;
				amount -= damCapacity;
			}
		}
	}
	//  If we get down here, we've overkilled the enemy
}

//  returns true if the damageGrid has any system crippled
//  This is specific to the system layout on a Jugernaut's damage grid
function crippledSystem(){
	if(damageGrid[1] >= 5 && damageGrid[2] >= 5) return 1;			//  LEFT ARM
	if(damageGrid[2] == 6 && damageGrid[3] == 6) return 1;			//  MOVEMENT
	if(damageGrid[4] == 6 && damageGrid[5] == 6) return 1;			//  CORTEX
	if(damageGrid[5] >= 5 && damageGrid[6] >= 5) return 1;			//  RIGHT ARM
	return 0;
}

///////////////////////////////////////
// HELPER FUNCTIONS
///////////////////////////////////////

function get1d6(){
	let die1 = floor(rand() * 6) + 1;
	++rolls[die1];
	++totalDiceRolled;
	oneD6Sum += die1;
	++oneD6Rolls;
	return die1;
}

function get2d6(){
	let die1 = floor(rand() * 6) + 1;
	let die2 = floor(rand() * 6) + 1;
	++rolls[die1];
	++rolls[die2];
	++totalDiceRolled;
	++totalDiceRolled;
	twoD6Sum += die1 + die2;
	++twoD6Rolls;
	return die1 + die2;
}

function get3d6(){
	let die1 = floor(rand() * 6) + 1;
	let die2 = floor(rand() * 6) + 1;
	let die3 = floor(rand() * 6) + 1;
	++rolls[die1];
	++rolls[die2];
	++rolls[die3];
	++totalDiceRolled;
	++totalDiceRolled;
	++totalDiceRolled;
	threeD6Sum += die1 + die2 + die3;
	++threeD6Rolls;
	return die1 + die2 + die3;
}

//  NOTE: Moving this inline for speed
// function addCommasToBigNumbers(bigNumber){
// 	return bigNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// }
