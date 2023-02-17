
export const progression = (() => {
    class ProgressionManager {
        constructor() {
            this.progress_ = 0.0;
        }

        Update(timeElapsed, pause, buffspeed, speed) {
            this.UpdateProgression_(timeElapsed, pause, buffspeed, speed);
        }

        //Progression 
        UpdateProgression_(timeElapsed, pause, buffspeed, speed) {
            if (!pause) {

                //if speed buff is active, move the person faster/ slower on the progression UI 
                if (buffspeed) {
                    this.progress_ += ((timeElapsed * 10.0) * (speed / 0.22));
                }
                else {
                    this.progress_ += timeElapsed * 10.0;

                }
                const scoreText = (Math.round((this.progress_ * 10) / 10)).toLocaleString(
                    'en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 5;


                const scoreText1 = (Math.round((this.progress_ * 10) / 10)).toLocaleString(
                    'en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 5;
                document.getElementById('runner').style.left = scoreText * 4.1 + 'px';

                document.getElementById('monster').style.left = scoreText1 * 4.1 + 'px';

                if (this.progress_ >= 500) {
                    document.dispatchEvent(new CustomEvent('score-over'));
                }

            }

        }
    }

    return {
        ProgressionManager: ProgressionManager,
    };
})();