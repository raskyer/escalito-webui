import { Point } from '../drawables/Point';
import { Order } from '../orders/Order';
import { AbstractCharacter } from './AbstractCharacter';

export class Client extends AbstractCharacter {
  private _order?: Order;
  private _orderFactory?: () => Order;

  public set orderFactory(orderFactory: () => Order) {
    this._orderFactory = orderFactory;
  }

  public behave(next: Point, bar: Point, spawn: Point): void {
    if (!this._state.moving && !this._state.waiting && !this.isNear(next, 4)) {
      this.moveTo(next, 4);
    }

    if (this._state.leaving) {
      throw new Error('Client should not behave while leaving');
    }

    if (this._order === null && this.isNear(bar, 4)) {
      this.askOrder();
      this.await();
    } else if (this._state.exhausted) {
      this.leave(spawn);
    }
  }

  private async behaveAsync(next: Point, bar: Point, spawn: Point) {
    await this.moveToAsync(next, 4);

    if (next !== bar) {
      return;
    }

    this.askOrder();
    try {
      await this.await();
    } catch (exhausted) {
      await this.leave(spawn);
    }
  }

  private askOrder(): void {
    if (this._order !== undefined) {
      throw new Error('Client has already order');
    }

    if (this._orderFactory === undefined) {
      throw new Error('Undefined order factory');
    }

    this._order = this._orderFactory();
    // orderImage.sprite = MagicBag.Bag.cocktail.GetSprite(Order.Cocktail.Key);
    // orderImage.gameObject.SetActive(true);
  }

  private async leave(spawn: Point): Promise<void> {
    this.leaveTo(spawn);
  }
}