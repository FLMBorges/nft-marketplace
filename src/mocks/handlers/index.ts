import { scenarioHandler } from '../scenario'
import { socketHandler } from '../realtime'
import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'

// O handler de cenário vem primeiro: aplica latência e falhas antes das rotas reais.
export const handlers = [
  scenarioHandler,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...accountHandlers,
  socketHandler,
]
