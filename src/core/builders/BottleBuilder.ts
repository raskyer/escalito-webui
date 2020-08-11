import { IngredientExtended } from '../../entities/dynamic/IngredientExtended';
import { IEmitter } from '../../entities/game/IEmitter';
import { IPoint } from '../../entities/game/IPoint';
import { IScene } from '../../entities/game/IScene';
import { IngredientKey } from '../../entities/static/Ingredient';
import { Bottle } from '../cocktails/Bottle';
import { BarController } from '../controllers/BarController';
import { SelectController } from '../controllers/SelectController';
import { Bar } from '../sprites/Bar';
import { SpriteKey } from '../sprites/SpriteKey';

export const IngredientToSprite: { [key in IngredientKey]: SpriteKey } = {
  [IngredientKey.Rum]: SpriteKey.BottleRum,
  [IngredientKey.Cola]: SpriteKey.BottleCola,
  [IngredientKey.Lemonade]: SpriteKey.BottleLemonade,
  [IngredientKey.Lemon]: SpriteKey.BottleRum,
  [IngredientKey.Strawberry]: SpriteKey.BottleRum
};

export class BottleBuilder {
  private readonly _scene: IScene;
  private readonly _emitter: IEmitter;

  private _ingredient?: IngredientExtended;
  private _sprite?: Phaser.GameObjects.Sprite;
  private _stockBar?: Bar;

  public constructor(scene: IScene, emitter: IEmitter) {
    this._scene = scene;
    this._emitter = emitter;
  }

  public get sprite(): Phaser.GameObjects.Sprite {
    if (this._sprite === undefined) {
      throw new Error('Can not access sprite on un-build builder');
    }
    return this._sprite;
  }

  public get stockBar(): Bar {
    if (this._stockBar === undefined) {
      throw new Error('Can not access stock bar on un-build builder');
    }
    return this._stockBar;
  }

  public get ingredient(): IngredientExtended {
    if (this._ingredient === undefined) {
      throw new Error('Can not access ingredient on un-build builder');
    }
    return this._ingredient;
  }

  public get emitter(): IEmitter {
    return this._emitter;
  }

  public get barCtr(): BarController {
    return this._scene.getController<BarController>(BarController.KEY);
  }

  public get glassPosition(): IPoint {
    return this._scene.settings.middleDimension;
  }

  public build(ingredient: IngredientExtended): Bottle {
    this._ingredient = ingredient;

    this.buildSprite();
    this.buildStockBar();

    return new Bottle(this);
  }

  private buildSprite() {
    const { x, y } = this._scene.settings.bottle;
    const sprite = this._scene.add.sprite(
      x,
      y,
      IngredientToSprite[this.ingredient.provided.base.key]
    );

    sprite
      .setY(y - sprite.displayHeight / 2)
      .setName(this.ingredient.provided.base.name)
      .setInteractive();

    const ctr = this._scene.getController<SelectController>(
      SelectController.KEY
    );
    ctr.addSelect(this._scene, sprite);

    this._sprite = sprite;
  }

  private buildStockBar() {
    const background = this._scene.add.graphics().setDepth(2);
    const foreground = this._scene.add.graphics().setDepth(3);

    this._stockBar = new Bar(background, foreground);
  }
}
