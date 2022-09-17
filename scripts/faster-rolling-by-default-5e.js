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
    return fastForward || (event && (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey));
  }

  /**
   * Gets the local user's "faster by default" boolean
   * @returns true if the roll should be faster by default
   */
  static _getShouldBeFasterWithOverride() {
    const fasterGlobal = game.settings.get(this.MODULE_ID, this.SETTINGS.fasterGlobal);
    const fasterLocal = game.settings.get(this.MODULE_ID, this.SETTINGS.fasterLocal);

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
      config.fastForward = this._determineShouldFF(config);
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
  static init() {
    this.ROLL_DIALOG_HOOKS.forEach((hookName) => {
      Hooks.on(hookName, (document, config) => FasterRollingByDefault5e.skipRollDialog(config));
    });
  }
}

class FasterRollingByDefault5eItem {
  static ROLL_DIALOG_HOOKS = [
    'dnd5e.preRollAttack',
    'dnd5e.preRollDamage',
    'dnd5e.preRollToolCheck',
  ];

  /**
   * Handle Item Use auto-rolls
   * 
   * 1. If `autoRollItem` is enabled, roll the ToolCheck or AttackRoll, passing in the global event
   * 2. If `autoRollDamage` is enabled, roll damage passing in if it was a critical
   * 3. If `autoRollTable` is enabled and the module is active, draw a result from the table
   */
  static async onUseItem(item) {
    try {

      const autoRollItem = game.settings.get(FasterRollingByDefault5e.MODULE_ID, FasterRollingByDefault5e.SETTINGS.autoRollItem);
      const autoRollDamage = game.settings.get(FasterRollingByDefault5e.MODULE_ID, FasterRollingByDefault5e.SETTINGS.autoRollDamage);
      const autoRollTable = game.settings.get(FasterRollingByDefault5e.MODULE_ID, FasterRollingByDefault5e.SETTINGS.autoRollTable);

      if (!autoRollItem && !autoRollDamage && !autoRollTable) {
        return;
      }

      /** MUTATED based on attackRoll results */
      let critical = false;

      /** Deprecated Global Browser "event" */
      // TODO: Submit PR to core system to provide `event` on `item.use` by default
      const _event = foundry.utils.deepClonse(event);

      /** Roll Attack or Tool Check, using the `_event` */
      if (autoRollItem) {
        if (item.type === 'tool') {
          return item.rollToolCheck({
            event: _event,
          });
        }

        if (item.hasAttack) {
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
      FasterRollingByDefault5e.log(e);
    }
  }

  /**
   * Initialize all hooks related to Items
   */
  static init() {
    Hooks.on('onUseItem', this.onUseItem)

    this.ROLL_DIALOG_HOOKS.forEach((hookName) => {
      Hooks.on(hookName, (document, config) => FasterRollingByDefault5e.skipRollDialog(config));
    });
  }
}