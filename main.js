import { stage1 } from './stage1.js'
import { stage2 } from './stage2.js';

let _APP = null;
let _APP2 = null;

let stage = 1
window.addEventListener('DOMContentLoaded', () => {
  _APP = new stage1.BasicWorldDemo();

});

function myFunction() {
  if (stage == 1) {

    _APP.GetCompletionStatus(result => {
      console.log(result)
      if (result) {
        _APP = new stage1.BasicWorldDemo();
        stage = 2

      }
    })


  }

}

setInterval(myFunction, 1000); 