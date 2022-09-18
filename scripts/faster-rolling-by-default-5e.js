// @ts-check
/**
 * Overall class containing the ready logic
 */
class FasterRollingByDefault5e {
  static MODULE_ID = "faster-rolling-by-default-5e";
  static MODULE_TITLE = "Faster Rolling by Default DnD5e";

  /**
   * A console.log wrapper which checks if we are debugging before logging
   */
  static log(force, ...args) {
    try {
      const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.MODULE_ID, 'boolean');

      if (shouldLog) {
        console.log(this.MODULE_ID, '|', ...args);
      }
    } catch (e) {
      console.error(e.message);
    }
  }


  static WORLD_SETTINGS = {
    fasterGlobal: {
      settingName: 'faster-global',
      defaultValue: true,
    },
    autoRollItem: {
      settingName: 'auto-roll-item',
      defaultValue: true,
    },
    autoRollDamage: {
      settingName: 'auto-roll-damage',
      defaultValue: false,
    },
    autoRollTable: {
      settingName: 'auto-roll-table',
      defaultValue: false,
    },
  }

  static OVERRIDE_SETTINGS = {
    fasterLocal: {
      settingName: 'faster-local',
      options: [
        'useWorld',
        'overrideYes',
        'overrideNo'
      ]
    }
  }

  static get SETTINGS() {
    return {
      ...this.WORLD_SETTINGS,
      ...this.OVERRIDE_SETTINGS,
    }
  }

  static registerSettings() {
    Object.values(this.WORLD_SETTINGS).forEach(({ settingName, defaultValue }) => {
      game.settings.register(this.MODULE_ID, settingName, {
        name: `${this.MODULE_ID}.settings.${settingName}.name`,
        hint: `${this.MODULE_ID}.settings.${settingName}.hint`,
        config: true,
        scope: 'world',
        default: defaultValue,
        type: Boolean,
      });
    });

    Object.values(this.OVERRIDE_SETTINGS).forEach(({ settingName, options }) => {
      game.settings.register(this.MODULE_ID, settingName, {
        name: `${this.MODULE_ID}.settings.${settingName}.name`,
        hint: `${this.MODULE_ID}.settings.${settingName}.hint`,
        config: true,
        scope: 'client',
        default: options[0],
        type: String,
        choices: Object.fromEntries(options.map(
          (optionName) => [optionName, `${this.MODULE_ID}.settings.${settingName}.options.${optionName}`]
        )),
      });
    });
  }

  /**
   * Copied from core system.
   * @return `true` if `event.shiftKey` is not pressed, instead of the other way around.
   */
  static _determineShouldFF({ event, advantage = false, disadvantage = false, fastForward = false } = {}) {
    FasterRollingByDefault5e.log(false, '_determineShouldFF', {
      fastForward,
      event,
      shiftKey: event.shiftKey,
      or: (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey)
    });
    return fastForward || (event && (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey));
  }

  /**
   * Gets the local user's "faster by default" boolean
   * @returns true if the roll should be faster by default
   */
  static _getShouldBeFasterWithOverride() {
    const fasterGlobal = game.settings.get(this.MODULE_ID, this.SETTINGS.fasterGlobal.settingName);
    const fasterLocal = game.settings.get(this.MODULE_ID, this.SETTINGS.fasterLocal.settingName);

    switch (fasterLocal) {
      case 'overrideYes':
        return true;
      case 'overrideNo':
        return false;
      default:
        return fasterGlobal;
    }
  }

  /**
   * Utility to Skip a rollDialog for a d20
   * MUTATES `config`
   * @param {D20RollConfiguration | DamageRollConfiguration} config - roll dialog config
   */
  static skipRollDialog(config) {
    if (this._getShouldBeFasterWithOverride()) {
      const newFFValue = this._determineShouldFF(config);
      FasterRollingByDefault5e.log(false, 'skipping?', config, newFFValue);

      config.fastForward = newFFValue;

      FasterRollingByDefault5e.log(false, 'Mutating Event shiftKey from', config.event.shiftKey, 'to', newFFValue);
      // set the `event` shiftKey to be the same as our new fast forward value
      config.event.shiftKey = newFFValue;
    }

    return;
  }
}

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(FasterRollingByDefault5e.MODULE_ID);
});


class FasterRollingByDefault5eActor {
  static ROLL_DIALOG_HOOKS = [
    'dnd5e.preRollAbilityTest',
    'dnd5e.preRollSkill',
    'dnd5e.preRollAbilitySave',
    'dnd5e.preRollDeathSave',
  ];

  /**
   * Initialize all hooks related to Actors
   */
  static init = () => {
    this.ROLL_DIALOG_HOOKS.forEach((hookName) => {
      Hooks.on(hookName, (document, config) => FasterRollingByDefault5e.skipRollDialog(config));
    });
  }
}

class FasterRollingByDefault5eItem {

  /**
   * A 'fake event' we keep track of to provide to `handleUseItem`'s roll calls.
   * Populated during `handlePreUseItem` because later than this the browser's `event` becomes
   * a MessageEvent instead of the desired PointerEvent.
   */
  static FAKE_EVENT = {
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
  };

  static ROLL_DIALOG_HOOKS = [
    'dnd5e.preRollAttack',
    'dnd5e.preRollDamage',
    'dnd5e.preRollToolCheck',
  ];

  static _resetFakeEvent() {
    this.FAKE_EVENT = {
      altKey: false,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    };
  }

  /**
   * Work around the `useItem` method not getting `event` when it's called from most places.
   * // TODO: Submit PR to core system to provide `event` on `item.use` by default
   */
  static preserveFakeEvent = () => {
    try {
      const autoRollItem = game.settings.get(FasterRollingByDefault5e.MODULE_ID, FasterRollingByDefault5e.SETTINGS.autoRollItem.settingName);
      if (!autoRollItem) {
        return;
      }
      
      /** Deprecated Global Browser "event" */
      // Explicitly set this because these are wierd getters that `mergeObject` was messing up with
      this.FAKE_EVENT = {
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      }
      
      FasterRollingByDefault5e.log(false, 'FAKE_EVENT stored as', this.FAKE_EVENT);
    } catch (e) {
      FasterRollingByDefault5e.log(false, 'A problem happened when trying to preserve the global event.')
    }
  }

  /**
   * Handle Item Use auto-rolls
   * 
   * 1. If `autoRollItem` is enabled, roll the ToolCheck or AttackRoll, passing in the global event
   * 2. If `autoRollDamage` is enabled, roll damage passing in if it was a critical
   * 3. If `autoRollTable` is enabled and the module is active, draw a result from the table
   */
  static handleUseItem = async (item) => {
    const _event = foundry.utils.deepClone(this.FAKE_EVENT);
    this._resetFakeEvent();

    FasterRollingByDefault5e.log(false, 'handleUseItem', _event);
    try {
      const autoRollItem = game.settings.get(FasterRollingByDefault5e.MODULE_ID, FasterRollingByDefault5e.SETTINGS.autoRollItem.settingName);
      const autoRollDamage = game.settings.get(FasterRollingByDefault5e.MODULE_ID, FasterRollingByDefault5e.SETTINGS.autoRollDamage.settingName);
      const autoRollTable = game.settings.get(FasterRollingByDefault5e.MODULE_ID, FasterRollingByDefault5e.SETTINGS.autoRollTable.settingName);

      if (!autoRollItem && !autoRollDamage && !autoRollTable) {
        return;
      }

      /** MUTATED based on attackRoll results */
      let critical = false;


      /** Roll Attack or Tool Check, using the `_event` */
      if (autoRollItem) {
        if (item.type === 'tool') {
          FasterRollingByDefault5e.log(false, 'Tool Detected, rolling tool check', {
            event: _event,
          });

          return item.rollToolCheck({
            event: _event,
          });
        }

        if (item.hasAttack) {
          FasterRollingByDefault5e.log(false, 'Attack Detected, rolling attack roll', {
            event: _event,
          });

          const result = await item.rollAttack({
            event: _event
          });

          if (!result) {
            return;
          }

          if (result.isCritical) {
            critical = true;
          }
        }
      }

      /** Roll Damage, include if the attack roll was a critical hit */
      if (autoRollDamage && item.hasDamage) {
        item.rollDamage({
          critical,
        });
      }

      /** If the `items-with-rolltables-5e` module is active, try to roll the table from its flags */
      const tableUuid = foundry.utils.getProperty(item, 'flags.items-with-rolltables-5e.rollable-table-uuid');
      if (autoRollTable && tableUuid && game.modules.get('items-with-rolltables-5e')?.active) {
        const rollableTable = await fromUuid(tableUuid);

        if (!rollableTable) {
          ui.notifications.error(game.i18n.localize('items-with-rolltables-5e.missing-table-error'))
          return;
        }

        rollableTable.draw();
      }
    } catch (e) {
      console.error(FasterRollingByDefault5e.MODULE_TITLE, '|', e);
    }
  }

  /**
   * Initialize all hooks related to Items
   */
  static init = () => {
    Hooks.on('dnd5e.preUseItem', this.preserveFakeEvent);

    Hooks.on('dnd5e.useItem', this.handleUseItem);

    this.ROLL_DIALOG_HOOKS.forEach((hookName) => {
      Hooks.on(hookName, (document, config) => FasterRollingByDefault5e.skipRollDialog(config));
    });
  }
}

Hooks.on('init', () => {
  FasterRollingByDefault5e.registerSettings();

  FasterRollingByDefault5eActor.init();
  FasterRollingByDefault5eItem.init();
})
