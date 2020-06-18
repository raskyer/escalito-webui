import { Point } from '../drawables/Point';
import { Order } from '../orders/Order';
import { AbstractCharacter } from './AbstractCharacter';

export class Client extends AbstractCharacter {
  private _order: Order | null = null;

  public behave(next: Point): void {
    if (!this._state.moving && !this._state.waiting && !this.isNear(next)) {
      this.moveTo(next);
    }

    if (this._state.leaving) {
      throw new Error('Client should not behave while leaving');
    }

    if (this._order === null && this.isNear(null)) {
      this.askOrder();
      this.await();
    } else if (this._state.exhausted) {
      this.leave();
    }
  }

  private askOrder(): void {
    if (this._order !== null) {
      throw new Error('Client has already order');
    }

    this._order = null;
    // orderImage.sprite = MagicBag.Bag.cocktail.GetSprite(Order.Cocktail.Key);
    // orderImage.gameObject.SetActive(true);
  }

  private leave(): void {}
}
