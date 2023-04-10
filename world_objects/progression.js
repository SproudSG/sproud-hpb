
export const progression = (() => {
    class ProgressionManager {
        constructor() {
            this.progress_ = 0.0;
        }

        Update(timeElapsed, pause, stage) {
            this.UpdateProgression_(timeElapsed, pause, stage);
        }

        //Progression 
        UpdateProgression_(timeElapsed, pause, stage) {
            if (!pause && timeElapsed < 0.1) {

                this.progress_ += timeElapsed * 10.0;

                const scoreText = (Math.round((this.progress_ * 10) / 10)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 5;
                const scoreText1 = (Math.round((this.progress_ * 10) / 10)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 5;
                document.getElementById('runner').style.left = scoreText * 4.1 + 'px';
                document.getElementById('monster').style.left = scoreText1 * 4.1 + 'px';

                if (this.progress_ >= 510) {
                    if (stage == 1) {
                        document.dispatchEvent(new CustomEvent('score-over1'));
                    } else if (stage == 2) {
                        document.dispatchEvent(new CustomEvent('score-over2'));
                    } else if (stage == 3) {
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