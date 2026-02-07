# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.275] - 2026-02-07

### Phase 2 Complete (Work Orders 0317-0375)

#### Added - P2-A Extensible Architecture (0317-0330)
- ExpansionRegistry for expansion pack management
- TraitHandler base class and implementations for all 19 traits
- RuleEngine with overridable game rules
- EffectSystem for trait effects
- EventBus for game event handling
- Expansion validation system

#### Added - P2-B Frontend UI (0331-0350)
- Card components: CardBase, CreatureCard, TraitCard, HandCard
- TraitBadge and FoodIndicator sub-components
- GameBoard layout with PlayerArea and FoodPool
- Drag-and-drop system with DragDropContext
- Animation system with AnimationController
- Enhanced evolutionStore with selectors and actions
- evolutionSocket service integration
- Responsive design for all screen sizes
- Component unit tests

#### Added - P2-C Database & Statistics (0351-0360)
- Database schema for game records
- Game record auto-save functionality
- History and statistics API endpoints
- Achievement system with 20+ achievements
- Achievement UI components
- Multi-dimensional leaderboard
- Profile page with player stats
- Leaderboard page
- Database integration tests

#### Added - P2-D Quality Assurance (0361-0375)
- ReconnectionManager for handling disconnections
- OfflineHandler for offline state management
- TouchController for mobile optimization
- Mobile-responsive UI adjustments
- Frontend performance: React.memo, VirtualList, VirtualGrid
- Backend performance: DeltaCalculator, MemoryCache, BatchProcessor
- Cypress E2E testing framework
- E2E tests for core game flows
- E2E tests for edge cases and network conditions
- Sentry error monitoring integration
- Structured logging system with rotation
- Accessibility: keyboard navigation, ARIA, color-blind modes
- Security: rate limiting, CORS, XSS protection, input validation
- CI/CD: GitHub Actions workflows, Docker configuration

---

## [1.0.217] - 2026-02-01

### Phase 1 Complete (Work Orders 0228-0316)

#### Added - Core Game Logic (0228-0232)
- Game constants in shared/constants/evolution.js
- Card logic module (84 double-sided cards)
- Creature logic module
- Feeding logic module
- Phase logic module

#### Added - Trait System (0233-0251)
- All 19 traits implemented:
  - Carnivore traits: Carnivore, Scavenger, Sharp Vision
  - Defense traits: Camouflage, Burrowing, Poisonous, Aquatic, Agile, Massive, Tail Loss, Mimicry
  - Feeding traits: Fat Tissue, Hibernation, Parasite, Robbery
  - Interaction traits: Communication, Cooperation, Symbiosis
  - Special traits: Trampling

#### Added - Frontend Components (0252-0259)
- EvolutionRoom main component
- Game board components
- Card display components
- Phase indicator and turn timer
- Attack resolver and dice roller
- Score board and game log

#### Added - Platform Integration (0260-0263)
- Game type selector in lobby
- Socket.io event handlers for Evolution
- Redux store for Evolution game state
- Router integration

#### Added - Database (0264-0266)
- Evolution game tables in Supabase
- Game record saving
- Basic leaderboard

#### Fixed - Room System (0272-0282)
- Socket connection debugging
- Room creation flow
- Navigation fixes

#### Fixed - Core Bugs (0283-0302)
- Various gameplay bug fixes
- State synchronization issues

#### Added - Testing V2 (0303-0312)
- Unit tests for all logic modules
- Integration tests
- Basic E2E tests

#### Refactored - Room Handler (0313-0316)
- Complete rewrite of evolutionGameHandler
- Improved state management
- Better error handling

---

## [1.0.0] - 2026-01-15

### Initial Release

#### Added
- Herbalism game (本草) - fully playable
- Multi-game platform architecture
- User authentication with Firebase
- Friend system
- Real-time multiplayer with Socket.io
- Supabase database integration
