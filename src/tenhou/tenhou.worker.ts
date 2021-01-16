import { expose } from 'comlink'
import { promotionProb, promotionEG, demotionEG, demotionEGs } from '.'
export default {} as typeof Worker & {new (): Worker}
const api =
{
    promotionProb: promotionProb,
    promotionEG: promotionEG,
    demotionEG: demotionEG,
    demotionEGs: demotionEGs,
}
expose(api)
