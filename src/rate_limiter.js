export default class RateLimiter {
  _creditsPerSecond
  _balance
  _maxBalance
  _lastTick

  constructor(creditsPerSecond, maxBalance, initBalance) {
    this._creditsPerSecond = creditsPerSecond
    this._balance = initBalance || Math.random() * maxBalance
    this._maxBalance = maxBalance
    this._lastTick = new Date().getTime()
  }

  _updateBalance() {
    const currentTime = new Date().getTime()
    const elapsedTime = (currentTime - this._lastTick) / 1000
    const balanceTime = elapsedTime * this._creditsPerSecond

    this._lastTick = currentTime
    this._balance = balanceTime > this._maxBalance ? this.maxBalance : balanceTime
  }

  update(creditsPerSecond, maxBalance) {
    this._updateBalance()
    this._creditsPerSecond = creditsPerSecond
    // The new balance should be proportional to the old balance.
    this._balance = maxBalance * this._balance / this._maxBalance;
    this._maxBalance = maxBalance;
  }

  checkCredit(itemCost) {
    this._updateBalance()
    const fitItemCostIntoBalance = this._balance >= itemCost
    this._balance = fitItemCostIntoBalance ? this._balance - itemCost : this._balance

    return fitItemCostIntoBalance
  }
}
