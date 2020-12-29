export class CallbackController {
  groupFinalized() {}
}

export default class CallbackGroup {
  constructor() {
    this.controllers = new Set();
    this.finalized = false;
  }

  verifyActive() {
    if (this.finalized) {
      throw 'relevant CallbackGroup has been finalized';
    }
  }

  addSubscriber(controller) {
    this.controllers.add(controller);
  }

  deleteSubscriber(controller) {
    this.controllers.delete(controller);
  }

  disable() {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    for (const controller of this.controllers) {
      controller.groupFinalized();
    }
  }
}
