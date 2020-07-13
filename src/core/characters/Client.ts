import { Order } from '../../entities/static/Order';
import { Glass } from '../cocktails/Glass';
import { BarController } from '../controllers/BarController';
import { MainController } from '../controllers/MainController';
import { Point } from '../sprites/Point';
import { TintHelper } from '../utils/TintHelper';
import { AbstractCharacter } from './AbstractCharacter';
import { IBehavioral } from './IBehavioral';

export class Client extends AbstractCharacter implements IBehavioral {
  private static readonly PATIENCE: number = 2000;
  private static readonly SATISFACTION_THRESHOLD: number = 20;
  private static readonly STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
    color: '#FFF',
    fontFamily: 'Arial Black',
    fontSize: '10px',
    backgroundColor: '#000',
    padding: {
      x: 5,
      y: 2
    }
  };

  private _patience: number = 0;
  private _timeAwaited: number = 0;
  private _satisfaction: number = 0;

  private _order?: Order;
  private _orderText?: Phaser.GameObjects.Text;

  private _onServe?: Function;
  private _onExhaust?: Function;

  private _createOrder: () => Order | undefined = () => undefined;

  public get satisfaction(): number {
    return this._satisfaction;
  }

  public get satisfied(): boolean {
    return this._satisfaction > Client.SATISFACTION_THRESHOLD;
  }

  public set satisfaction(satisfaction: number) {
    this._satisfaction = satisfaction;
    this._sprite.tint = TintHelper.getTint(satisfaction);
  }

  public set createOrder(createOrder: () => Order | undefined) {
    this._createOrder = createOrder;
  }

  public update(delta: number) {
    super.update(delta);
    if (this._state.waiting) {
      this.stepWait(delta);
    }
  }

  public behave(next: Point, bar: Point, spawn: Point): void {
    if (this._state.leaving) {
      throw new Error('Client should not behave while leaving');
    }

    if (this._state.moving || this._state.waiting) {
      return;
    }

    if (this._state.exhausted) {
      this.serve(undefined);
      return this.leaveTo(spawn);
    } else if (this._state.served) {
      return this.leaveTo(spawn);
    }

    if (!this.isNear(next, 4)) {
      return this.moveTo(next, 4);
    }

    if (this._order === undefined && this.isNear(bar, 4)) {
      if (!this.askOrder()) {
        this.satisfaction = 0;
        this.leaveTo(spawn);
      } else {
        this.await();
      }
    }
  }

  public askOrder(): boolean {
    if (this._order !== undefined) {
      throw new Error('Client has already order');
    }

    this._order = this._createOrder();

    if (this._order === undefined) {
      return false;
    }

    const barCtr = this._scene.getController<BarController>(BarController.KEY);
    const glass = barCtr.glass;

    if (glass !== undefined) {
      const collider = this._scene.physics.add.collider(
        this._sprite,
        glass.sprite,
        () => {
          this.serve(glass);
          collider.destroy();
        }
      );
    }

    this._orderText = this._scene.add
      .text(this._sprite.x, this._sprite.y, this._order.title, Client.STYLE)
      .setDepth(2)
      .setInteractive()
      .on('pointerdown', () => {
        this._onServe?.();
      });

    return true;
  }

  public await(): Promise<void> {
    if (this._state.waiting) {
      throw new Error('Client is already awaiting');
    }

    const promise = new Promise<void>(resolve => {
      this._onServe = resolve;
    });

    this._state.wait();
    this._patience = -1;
    this._timeAwaited = 0;

    // waitingSlider.gameObject.SetActive(true);
    // waitingSlider.minValue = 0;
    // waitingSlider.maxValue = _currentPatience;

    return promise;
  }

  public serve(glass?: Glass) {
    if (this._order === undefined || this._orderText === undefined) {
      throw new Error('Client can not be served if no order was ask');
    }

    this._state.serve();
    this.satisfaction = this.computeSatisfaction(glass);
    const mainCtr = this._scene.getController<MainController>(
      MainController.KEY
    );
    mainCtr.increment(this, this._order);
    this._order = undefined;
    this._orderText.destroy();
  }

  private stepWait(delta: number): void {
    this._timeAwaited += delta;
    // waitingSlider.value = _currentPatience - _timeAwaited;
    // var percent = 100 - _timeAwaited / _currentPatience * 100;
    // waitingImage.color = PercentHelper.GetColor((int) percent);

    if (this._patience === -1 || this._timeAwaited < this._patience) {
      return;
    }

    this._state.exhaust();
    this._onServe = undefined;
    this._onExhaust?.();
    this._onExhaust = undefined;
  }

  private computeSatisfaction(glass?: Glass): number {
    if (glass === undefined) {
      return 0;
    }

    if (this._order === undefined) {
      throw new Error();
    }

    const satisfactions: number[] = [];
    const actualRecipe = glass.recipe;

    for (const [key, expected] of this._order.recipe.entries()) {
      const actual = actualRecipe.get(key) ?? 0;
      const satisfaction = this.computeDifference(expected, actual);
      satisfactions.push(satisfaction);
    }

    for (const key of actualRecipe.keys()) {
      if (!this._order.recipe.has(key)) {
        satisfactions.push(0);
      }
    }

    return satisfactions.reduce((p, n) => p + n, 0) / satisfactions.length;
  }

  private computeDifference(expected: number, actual: number) {
    var difference = actual - expected;
    var differencePercentage = (difference / expected) * 100;

    if (differencePercentage > 10) {
      return 110;
    }

    return 100 + differencePercentage;
  }
}
