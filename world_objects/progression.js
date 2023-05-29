
export const progression = (() => {
    class ProgressionManager {
        constructor() {
            this.progress_ = 0.0;
        }

        Update(timeElapsed, pause, stage, buffspeed) {
            this.UpdateProgression_(timeElapsed, pause, stage, buffspeed);
        }

        //Progression 
        UpdateProgression_(timeElapsed, pause, stage, buffspeed) {
            if (!pause && timeElapsed < 0.1) {

                //if speed buff is active, move the person faster/ slower on the progression UI 
                if (buffspeed) {
                    this.progress_ += ((timeElapsed * 10.0) * (speed / 0.2));
                }
                else {
                    this.progress_ += timeElapsed * 10.0;
                }
                const scoreText = ((Math.round((this.progress_ * 10) / 10)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 60) - 2;
                const scoreText1 = (Math.round((this.progress_ * 10) / 10)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 60;
                document.getElementById('runner').style.left = scoreText + 'vw';
                document.getElementById('monster').style.left = scoreText1 + 'vw';

                if (this.progress_ >= 50) {
                    if (stage == 1) {
                       document.dispatchEvent(new CustomEvent('score-over1'));
                    }
                }

                if (this.progress_ >= 60) {
                    if (stage == 2) {
                        document.dispatchEvent(new CustomEvent('score-over2'));
                    }
                }

                if (this.progress_ >= 800) {
                    if (stage == 3) {
                        document.dispatchEvent(new CustomEvent('score-over3'));
                    }
                }
            }
        }
    }
    return {
        ProgressionManager: ProgressionManager,
    };
})();