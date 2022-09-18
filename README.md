# Faster Rolling by Default DnD5e

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FElfFriend-DnD%2Ffoundryvtt-faster-rolling-by-default-5e%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange)
![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads@latest&query=assets%5B1%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FElfFriend-DnD%2Ffoundryvtt-faster-rolling-by-default-5e%2Freleases%2Flatest)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ffaster-rolling-by-default-5e&colorB=4aa94a)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ffaster-rolling-by-default-5e%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/faster-rolling-by-default-5e/)
[![Foundry Hub Comments](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Ffaster-rolling-by-default-5e%2Fshield%2Fcomments)](https://www.foundryvtt-hub.com/package/faster-rolling-by-default-5e/)

[![ko-fi](https://img.shields.io/badge/-buy%20me%20a%20coke-%23FF5E5B)](https://ko-fi.com/elffriend)
[![patreon](https://img.shields.io/badge/-patreon-%23FF424D)](https://www.patreon.com/ElfFriend_DnD)

A module that makes using items faster by default in dnd5e.

This module is heavily inspired by [Minimal Rolling Enhancements for D&D5e (MRE)](https://github.com/ElfFriend-DnD/FVTT-Minimal-Rolling-Enhancements-DND5E).

## Configurability

### Roll Configuration Dialog Behavior

The main difference someone may notice with this module is that they are prompted less often to configure a roll being made.

#### Core Behavior -- Skip Roll Dialogs: False

The core 5e system behavior is to always prompt the user when making a dice roll which might have a situational bonus, advantage, or disadvantage. It allows skipping this dialog by holding Shift when clicking on a roll button.

```mermaid
  flowchart LR;
      A([User]) --> B[Clicks Roll Attack];
      B --> C{Shift Key Held?};
      C -->D[No];
      D -->E[Display Dialog];
      E --> G[Display Roll in Chat];
      C -->F[Yes] -->G;
      style A fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style B fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style C fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style E fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style D fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style G fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
```
User flow with no Shift Key held is Highlighted.

#### Module Behavior -- Skip Roll Dialogs: True

This module allows GMs to configure the opposite behavior as the default: Do Not prompt the user when making a dice roll _unless_ they are holding Shift when clicking the roll button.

Players have the ability to opt out of this setting and set their own desired behavior.

```mermaid
  flowchart LR;
      A([User]) --> B[Clicks Roll Attack];
      B --> C{Shift Key Held?};
      C -->D[No] -->G;
      C -->E[Yes];
      E -->F[Display Dialog];
      F --> G[Display Roll in Chat];
      style A fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style B fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style C fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style D fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
      style G fill:#2F932C,stroke:#000,stroke-width:1px,color:#fff
```
User flow with no Shift Key held is Highlighted.

### Item Usage Behavior

Allows GMs to configure whether Items automatically roll any or all of the following when "used":
- Attack Rolls and Tool Checks
- Damage Rolls
    - Always rolls the First Rollgroup if "[Roll Groups](https://github.com/krbz999/rollgroups)" is active.
- Rollable Tables (via [Items With Rollable Tables DnD5e](https://foundryvtt.com/packages/items-with-rolltables-5e))

Super Charged by:
- [Retroactive Advantage D&D5e](https://github.com/ElfFriend-DnD/foundryvtt-retroactive-advantage-5e)
- [Roll Groups](https://github.com/krbz999/rollgroups)
- [Attack Roll Check D&D5e](https://github.com/ElfFriend-DnD/foundryvtt-attack-roll-check-5e)
- [Items With Rollable Tables DnD5e](https://github.com/ElfFriend-DnD/foundryvtt-items-with-rolltables-5e)

Compatible with:
- Core dnd5e roller

Partial Compatibility with:
- [Advantage Reminder](https://github.com/kaelad02/adv-reminder) -- Some configurations and effect setups will interrupt a normally skipped roll dialog to remind you about things. Improved Integration is a Work in Progress.

Unknown Compatibility with:
- Ready Set Roll

Not Compatible with:
- Midi QOL -- Midi can do everything this modules does and more, you don't need this if you're running with Midi.