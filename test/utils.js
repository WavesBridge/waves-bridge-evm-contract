function toWeiBN(amount) {
    return new web3.utils.BN(web3.utils.toWei(amount));
}

module.exports = {
    toWeiBN
};