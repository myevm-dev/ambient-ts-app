// START: Import React and Dongles
import { useState, useEffect, useContext } from 'react';

import {
    tickToPrice,
    pinTickLower,
    pinTickUpper,
    priceHalfAboveTick,
    priceHalfBelowTick,
} from '@crocswap-libs/sdk';

// START: Import React Functional Components
import LimitExtraInfo from '../../../components/Trade/Limit/LimitExtraInfo/LimitExtraInfo';
import Modal from '../../../components/Global/Modal/Modal';
import Button from '../../../components/Global/Button/Button';
import ConfirmLimitModal from '../../../components/Trade/Limit/ConfirmLimitModal/ConfirmLimitModal';

// START: Import Local Files
import {
    useAppDispatch,
    useAppSelector,
} from '../../../utils/hooks/reduxToolkit';
import { useModal } from '../../../components/Global/Modal/useModal';
import {
    setLimitTick,
    setLimitTickCopied,
} from '../../../utils/state/tradeDataSlice';
import {
    addPendingTx,
    addReceipt,
    addTransactionByType,
    removePendingTx,
} from '../../../utils/state/receiptDataSlice';
import {
    isTransactionFailedError,
    isTransactionReplacedError,
    TransactionError,
} from '../../../utils/TransactionError';
import BypassConfirmLimitButton from '../../../components/Trade/Limit/BypassConfirmLimitButton/BypassConfirmLimitButton';
import { limitTutorialSteps } from '../../../utils/tutorial/Limit';
import { IS_LOCAL_ENV } from '../../../constants';
import { CrocEnvContext } from '../../../contexts/CrocEnvContext';
import { UserPreferenceContext } from '../../../contexts/UserPreferenceContext';
import { PoolContext } from '../../../contexts/PoolContext';
import { ChainDataContext } from '../../../contexts/ChainDataContext';
import { TokenContext } from '../../../contexts/TokenContext';
import { TradeTokenContext } from '../../../contexts/TradeTokenContext';
import { useTradeData } from '../../../App/hooks/useTradeData';
import { getReceiptTxHashes } from '../../../App/functions/getReceiptTxHashes';
import { CachedDataContext } from '../../../contexts/CachedDataContext';
import { getFormattedNumber } from '../../../App/functions/getFormattedNumber';
import { TradeModuleSkeleton } from '../../../components/Trade/TradeModules/TradeModuleSkeleton';
import LimitRate from '../../../components/Trade/Limit/LimitRate/LimitRate';
import TradeModuleHeader from '../../../components/Trade/TradeModules/TradeModuleHeader';
import LimitTokenInput from '../../../components/Trade/Limit/LimitTokenInput/LimitTokenInput';

export default function Limit() {
    const { cachedQuerySpotPrice } = useContext(CachedDataContext);
    const {
        crocEnv,
        chainData: { chainId, gridSize },
        ethMainnetUsdPrice,
    } = useContext(CrocEnvContext);
    const { gasPriceInGwei, lastBlockNumber } = useContext(ChainDataContext);
    const { pool, isPoolInitialized } = useContext(PoolContext);
    const { tokens } = useContext(TokenContext);
    const {
        tokenAAllowance,
        setRecheckTokenAApproval,
        baseToken: {
            balance: baseTokenBalance,
            dexBalance: baseTokenDexBalance,
        },
        quoteToken: {
            balance: quoteTokenBalance,
            dexBalance: quoteTokenDexBalance,
        },
    } = useContext(TradeTokenContext);
    const { mintSlippage, dexBalLimit, bypassConfirmLimit } = useContext(
        UserPreferenceContext,
    );

    const { limitTickFromParams } = useTradeData();

    const tradeData = useAppSelector((state) => state.tradeData);

    const tokenA = tradeData.tokenA;
    const tokenB = tradeData.tokenB;

    const dispatch = useAppDispatch();

    const [isModalOpen, openModal, closeModal] = useModal();
    const [limitAllowed, setLimitAllowed] = useState<boolean>(false);

    const [tokenAInputQty, setTokenAInputQty] = useState<string>(
        tradeData.isTokenAPrimary ? tradeData?.primaryQuantity : '',
    );
    const [tokenBInputQty, setTokenBInputQty] = useState<string>(
        !tradeData.isTokenAPrimary ? tradeData?.primaryQuantity : '',
    );

    const [isWithdrawFromDexChecked, setIsWithdrawFromDexChecked] =
        useState(false);
    const [isSaveAsDexSurplusChecked, setIsSaveAsDexSurplusChecked] = useState(
        dexBalLimit.outputToDexBal.isEnabled,
    );

    const [limitButtonErrorMessage, setLimitButtonErrorMessage] =
        useState<string>('');
    const [priceInputFieldBlurred, setPriceInputFieldBlurred] = useState(false);

    const [newLimitOrderTransactionHash, setNewLimitOrderTransactionHash] =
        useState('');
    const [txErrorCode, setTxErrorCode] = useState('');

    const [showConfirmation, setShowConfirmation] = useState<boolean>(true);

    const resetConfirmation = () => {
        setShowConfirmation(true);
        setTxErrorCode('');
    };

    const isTokenAPrimary = tradeData.isTokenAPrimary;
    const limitTick = tradeData.limitTick;
    const poolPriceNonDisplay = tradeData.poolPriceNonDisplay;

    const [endDisplayPrice, setEndDisplayPrice] = useState<number>(0);
    const [startDisplayPrice, setStartDisplayPrice] = useState<number>(0);
    const [middleDisplayPrice, setMiddleDisplayPrice] = useState<number>(0);
    const [orderGasPriceInDollars, setOrderGasPriceInDollars] = useState<
        string | undefined
    >();

    const [displayPrice, setDisplayPrice] = useState('');
    const [previousDisplayPrice, setPreviousDisplayPrice] = useState('');

    const isDenomBase = tradeData.isDenomBase;
    const limitTickCopied = tradeData.limitTickCopied;
    useEffect(() => {
        if (limitTickFromParams && limitTick === undefined) {
            dispatch(setLimitTick(limitTickFromParams));
        }
    }, [limitTickFromParams, limitTick === undefined]);

    const { baseToken, quoteToken } = tradeData;

    const isSellTokenBase = pool?.baseToken.tokenAddr === tokenA.address;

    useEffect(() => {
        (async () => {
            if (limitTick === undefined && crocEnv && !limitTickCopied) {
                if (!pool) return;

                const spotPrice = await cachedQuerySpotPrice(
                    crocEnv,
                    pool.baseToken.tokenAddr,
                    pool.quoteToken.tokenAddr,
                    chainId,
                    lastBlockNumber,
                );

                const initialLimitRateNonDisplay =
                    spotPrice * (isSellTokenBase ? 0.985 : 1.015);

                const pinnedTick: number = isSellTokenBase
                    ? pinTickLower(initialLimitRateNonDisplay, gridSize)
                    : pinTickUpper(initialLimitRateNonDisplay, gridSize);

                IS_LOCAL_ENV && console.debug({ pinnedTick });
                dispatch(setLimitTick(pinnedTick));

                const tickPrice = tickToPrice(pinnedTick);
                const tickDispPrice = pool.toDisplayPrice(tickPrice);

                tickDispPrice.then((tp) => {
                    const displayPriceWithDenom = isDenomBase ? tp : 1 / tp;
                    setEndDisplayPrice(displayPriceWithDenom);

                    const limitRateTruncated = getFormattedNumber({
                        value: displayPriceWithDenom,
                        isInput: true,
                        removeCommas: true,
                    });

                    setDisplayPrice(limitRateTruncated);
                    setPreviousDisplayPrice(limitRateTruncated);
                });

                const priceHalfAbove = pool.toDisplayPrice(
                    priceHalfAboveTick(pinnedTick, gridSize),
                );
                const priceHalfBelow = pool.toDisplayPrice(
                    priceHalfBelowTick(pinnedTick, gridSize),
                );
                const priceFullTickAbove = pool.toDisplayPrice(
                    tickToPrice(pinnedTick + gridSize),
                );
                const priceFullTickBelow = pool.toDisplayPrice(
                    tickToPrice(pinnedTick - gridSize),
                );

                if (isDenomBase) {
                    priceHalfAbove.then((priceHalfAbove) => {
                        if (isSellTokenBase)
                            setMiddleDisplayPrice(priceHalfAbove);
                    });
                    priceFullTickAbove.then((priceFullTickAbove) => {
                        if (isSellTokenBase)
                            setStartDisplayPrice(priceFullTickAbove);
                    });
                    priceHalfBelow.then((priceHalfBelow) => {
                        if (!isSellTokenBase)
                            setMiddleDisplayPrice(priceHalfBelow);
                    });
                    priceFullTickBelow.then((priceFullTickBelow) => {
                        if (!isSellTokenBase)
                            setStartDisplayPrice(priceFullTickBelow);
                    });
                } else {
                    priceHalfAbove.then((priceHalfAbove) => {
                        if (isSellTokenBase)
                            setMiddleDisplayPrice(1 / priceHalfAbove);
                    });
                    priceFullTickAbove.then((priceFullTickAbove) => {
                        if (isSellTokenBase)
                            setStartDisplayPrice(1 / priceFullTickAbove);
                    });
                    priceHalfBelow.then((priceHalfBelow) => {
                        if (!isSellTokenBase)
                            setMiddleDisplayPrice(1 / priceHalfBelow);
                    });
                    priceFullTickBelow.then((priceFullTickBelow) => {
                        if (!isSellTokenBase)
                            setStartDisplayPrice(1 / priceFullTickBelow);
                    });
                }
            } else if (limitTick) {
                if (!pool) return;

                const tickPrice = tickToPrice(limitTick);

                const tickDispPrice = pool.toDisplayPrice(tickPrice);

                tickDispPrice.then((tp) => {
                    const displayPriceWithDenom = isDenomBase ? tp : 1 / tp;

                    setEndDisplayPrice(displayPriceWithDenom);
                    const limitRateTruncated = getFormattedNumber({
                        value: displayPriceWithDenom,
                        isInput: true,
                        removeCommas: true,
                    });
                    setDisplayPrice(limitRateTruncated);
                    setPreviousDisplayPrice(limitRateTruncated);
                });

                const priceHalfAbove = pool.toDisplayPrice(
                    priceHalfAboveTick(limitTick, gridSize),
                );
                const priceHalfBelow = pool.toDisplayPrice(
                    priceHalfBelowTick(limitTick, gridSize),
                );
                const priceFullTickAbove = pool.toDisplayPrice(
                    tickToPrice(limitTick + gridSize),
                );
                const priceFullTickBelow = pool.toDisplayPrice(
                    tickToPrice(limitTick - gridSize),
                );

                if (isDenomBase) {
                    priceHalfAbove.then((priceHalfAbove) => {
                        if (isSellTokenBase)
                            setMiddleDisplayPrice(priceHalfAbove);
                    });
                    priceFullTickAbove.then((priceFullTickAbove) => {
                        if (isSellTokenBase)
                            setStartDisplayPrice(priceFullTickAbove);
                    });
                    priceHalfBelow.then((priceHalfBelow) => {
                        if (!isSellTokenBase)
                            setMiddleDisplayPrice(priceHalfBelow);
                    });
                    priceFullTickBelow.then((priceFullTickBelow) => {
                        if (!isSellTokenBase)
                            setStartDisplayPrice(priceFullTickBelow);
                    });
                } else {
                    priceHalfAbove.then((priceHalfAbove) => {
                        if (isSellTokenBase)
                            setMiddleDisplayPrice(1 / priceHalfAbove);
                    });
                    priceFullTickAbove.then((priceFullTickAbove) => {
                        if (isSellTokenBase)
                            setStartDisplayPrice(1 / priceFullTickAbove);
                    });
                    priceHalfBelow.then((priceHalfBelow) => {
                        if (!isSellTokenBase)
                            setMiddleDisplayPrice(1 / priceHalfBelow);
                    });
                    priceFullTickBelow.then((priceFullTickBelow) => {
                        if (!isSellTokenBase)
                            setStartDisplayPrice(1 / priceFullTickBelow);
                    });
                }

                setPriceInputFieldBlurred(false);
                if (limitTickCopied) dispatch(setLimitTickCopied(false));
            }
        })();
    }, [
        !!crocEnv,
        pool,
        limitTickCopied,
        limitTick,
        isDenomBase,
        priceInputFieldBlurred,
        isSellTokenBase,
    ]);

    const [isOrderValid, setIsOrderValid] = useState<boolean>(true);

    const updateLimitErrorMessage = () =>
        setLimitButtonErrorMessage(
            `Limit ${
                (isSellTokenBase && !isDenomBase) ||
                (!isSellTokenBase && isDenomBase)
                    ? 'Above Maximum'
                    : 'Below Minimum'
            }  Price`,
        );

    const updateOrderValidityStatus = async () => {
        try {
            if (!crocEnv) return;
            if (!limitTick) return;

            if (tokenAInputQty === '' && tokenBInputQty === '') return;

            const testOrder = isTokenAPrimary
                ? crocEnv.sell(tokenA.address, 0)
                : crocEnv.buy(tokenB.address, 0);

            const ko = testOrder.atLimit(
                isTokenAPrimary ? tokenB.address : tokenA.address,
                limitTick,
            );

            if (await ko.willMintFail()) {
                updateLimitErrorMessage();
                setIsOrderValid(false);
                return;
            } else {
                setIsOrderValid(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        updateOrderValidityStatus();
    }, [
        limitTick,
        poolPriceNonDisplay,
        tokenAInputQty === '' && tokenBInputQty === '',
    ]);

    const [showBypassConfirmButton, setShowBypassConfirmButton] =
        useState(false);
    const receiptData = useAppSelector((state) => state.receiptData);

    const sessionReceipts = receiptData.sessionReceipts;

    const pendingTransactions = receiptData.pendingTransactions;

    let receiveReceiptHashes: Array<string> = [];

    useEffect(() => {
        receiveReceiptHashes = getReceiptTxHashes(sessionReceipts);
    }, [sessionReceipts]);

    const currentPendingTransactionsArray = pendingTransactions.filter(
        (hash: string) => !receiveReceiptHashes.includes(hash),
    );

    const handleLimitButtonClickWithBypass = () => {
        setShowBypassConfirmButton(true);
        sendLimitOrder();
    };

    const [isWaitingForWallet, setIsWaitingForWallet] = useState(false);

    useEffect(() => {
        if (
            !currentPendingTransactionsArray.length &&
            !isWaitingForWallet &&
            txErrorCode === ''
        ) {
            setShowBypassConfirmButton(false);
        }
    }, [
        currentPendingTransactionsArray.length,
        isWaitingForWallet,
        txErrorCode === '',
    ]);

    useEffect(() => {
        setNewLimitOrderTransactionHash('');
        setShowBypassConfirmButton(false);
    }, [baseToken.address + quoteToken.address]);

    const sendLimitOrder = async () => {
        IS_LOCAL_ENV && console.debug('Send limit');
        if (!crocEnv) return;
        if (limitTick === undefined) return;
        resetConfirmation();
        setIsWaitingForWallet(true);

        IS_LOCAL_ENV && console.debug({ limitTick });

        const sellToken = tradeData.tokenA.address;
        const buyToken = tradeData.tokenB.address;
        const sellQty = tokenAInputQty;
        const buyQty = tokenBInputQty;

        const qty = isTokenAPrimary ? sellQty : buyQty;

        const order = isTokenAPrimary
            ? crocEnv.sell(sellToken, qty)
            : crocEnv.buy(buyToken, qty);
        const ko = order.atLimit(
            isTokenAPrimary ? buyToken : sellToken,
            limitTick,
        );
        if (await ko.willMintFail()) {
            IS_LOCAL_ENV &&
                console.debug(
                    'Cannot send limit order: Knockout price inside spread',
                );
            return;
        }

        let tx;
        try {
            tx = await ko.mint({ surplus: isWithdrawFromDexChecked });
            IS_LOCAL_ENV && console.debug(tx.hash);
            dispatch(addPendingTx(tx?.hash));
            setNewLimitOrderTransactionHash(tx.hash);
            setIsWaitingForWallet(false);
            if (tx?.hash)
                dispatch(
                    addTransactionByType({
                        txHash: tx.hash,
                        txType: `Add Limit ${tradeData.tokenA.symbol}→${tradeData.tokenB.symbol}`,
                    }),
                );
        } catch (error) {
            if (error.reason === 'sending a transaction requires a signer') {
                location.reload();
            }
            console.error({ error });
            setTxErrorCode(error.code);
            setIsWaitingForWallet(false);
            if (error.reason === 'sending a transaction requires a signer') {
                location.reload();
            }
        }

        let receipt;
        try {
            if (tx) receipt = await tx.wait();
        } catch (e) {
            const error = e as TransactionError;
            console.error({ error });
            // The user used "speed up" or something similar
            // in their client, but we now have the updated info
            if (isTransactionReplacedError(error)) {
                IS_LOCAL_ENV && console.debug('repriced');
                dispatch(removePendingTx(error.hash));
                const newTransactionHash = error.replacement.hash;
                dispatch(addPendingTx(newTransactionHash));
                setNewLimitOrderTransactionHash(newTransactionHash);
                IS_LOCAL_ENV && console.debug({ newTransactionHash });
                receipt = error.receipt;
            } else if (isTransactionFailedError(error)) {
                receipt = error.receipt;
            }
        }

        if (receipt) {
            dispatch(addReceipt(JSON.stringify(receipt)));
            dispatch(removePendingTx(receipt.transactionHash));
        }
    };

    const handleLimitButtonMessage = (tokenAAmount: number) => {
        if (!isPoolInitialized) {
            setLimitAllowed(false);
            if (isPoolInitialized === undefined)
                setLimitButtonErrorMessage('...');
            if (isPoolInitialized === false)
                setLimitButtonErrorMessage('Pool Not Initialized');
        } else if (isNaN(tokenAAmount) || tokenAAmount <= 0) {
            setLimitAllowed(false);
            setLimitButtonErrorMessage('Enter an Amount');
        } else if (!isOrderValid) {
            setLimitAllowed(false);
            setLimitButtonErrorMessage(
                `Limit ${
                    (isSellTokenBase && !tradeData.isDenomBase) ||
                    (!isSellTokenBase && tradeData.isDenomBase)
                        ? 'Above Maximum'
                        : 'Below Minimum'
                }  Price`,
            );
        } else {
            if (isWithdrawFromDexChecked) {
                if (
                    tokenAAmount >
                    parseFloat(tokenADexBalance) + parseFloat(tokenABalance)
                ) {
                    setLimitAllowed(false);
                    setLimitButtonErrorMessage(
                        `${tradeData.tokenA.symbol} Amount Exceeds Combined Wallet and Exchange Balance`,
                    );
                } else {
                    setLimitAllowed(true);
                }
            } else {
                if (tokenAAmount > parseFloat(tokenABalance)) {
                    setLimitAllowed(false);
                    setLimitButtonErrorMessage(
                        `${tradeData.tokenA.symbol} Amount Exceeds Wallet Balance`,
                    );
                } else {
                    setLimitAllowed(true);
                }
            }
        }
    };

    const handleModalClose = (): void => {
        closeModal();
        setNewLimitOrderTransactionHash('');
        resetConfirmation();
    };

    const bypassConfirmLimitButtonProps = {
        newLimitOrderTransactionHash: newLimitOrderTransactionHash,
        txErrorCode: txErrorCode,
        tokenAInputQty: tokenAInputQty,
        tokenBInputQty: tokenBInputQty,
        resetConfirmation: resetConfirmation,
        showBypassConfirmButton: showBypassConfirmButton,
        setShowBypassConfirmButton: setShowBypassConfirmButton,
        sendLimitOrder: sendLimitOrder,
        setNewLimitOrderTransactionHash: setNewLimitOrderTransactionHash,
    };

    const tokenABalance = isSellTokenBase
        ? baseTokenBalance
        : quoteTokenBalance;

    const tokenADexBalance = isSellTokenBase
        ? baseTokenDexBalance
        : quoteTokenDexBalance;

    const tokenASurplusMinusTokenARemainderNum =
        parseFloat(tokenADexBalance || '0') - parseFloat(tokenAInputQty || '0');

    const tokenAQtyCoveredByWalletBalance = isWithdrawFromDexChecked
        ? tokenASurplusMinusTokenARemainderNum < 0
            ? tokenASurplusMinusTokenARemainderNum * -1
            : 0
        : parseFloat(tokenAInputQty || '0');

    const isTokenAAllowanceSufficient =
        parseFloat(tokenAAllowance) >= tokenAQtyCoveredByWalletBalance;

    const [isApprovalPending, setIsApprovalPending] = useState(false);

    const approve = async (tokenAddress: string, tokenSymbol: string) => {
        if (!crocEnv) return;
        try {
            setIsApprovalPending(true);
            const tx = await crocEnv.token(tokenAddress).approve();
            if (tx) dispatch(addPendingTx(tx?.hash));
            if (tx?.hash)
                dispatch(
                    addTransactionByType({
                        txHash: tx.hash,
                        txType: `Approval of ${tokenSymbol}`,
                    }),
                );
            let receipt;
            try {
                if (tx) receipt = await tx.wait();
            } catch (e) {
                const error = e as TransactionError;
                console.error({ error });
                // The user used "speed up" or something similar
                // in their client, but we now have the updated info
                if (isTransactionReplacedError(error)) {
                    IS_LOCAL_ENV && console.debug('repriced');
                    dispatch(removePendingTx(error.hash));

                    const newTransactionHash = error.replacement.hash;
                    dispatch(addPendingTx(newTransactionHash));

                    IS_LOCAL_ENV && console.debug({ newTransactionHash });
                    receipt = error.receipt;
                } else if (isTransactionFailedError(error)) {
                    console.error({ error });
                    receipt = error.receipt;
                }
            }
            if (receipt) {
                dispatch(addReceipt(JSON.stringify(receipt)));
                dispatch(removePendingTx(receipt.transactionHash));
            }
        } catch (error) {
            if (error.reason === 'sending a transaction requires a signer') {
                location.reload();
            }
            console.error({ error });
        } finally {
            setIsApprovalPending(false);
            setRecheckTokenAApproval(true);
        }
    };

    useEffect(() => {
        if (gasPriceInGwei && ethMainnetUsdPrice) {
            const averageLimitCostInGasDrops = 193000;
            const gasPriceInDollarsNum =
                gasPriceInGwei *
                averageLimitCostInGasDrops *
                1e-9 *
                ethMainnetUsdPrice;

            setOrderGasPriceInDollars(
                getFormattedNumber({
                    value: gasPriceInDollarsNum,
                    isUSD: true,
                    prefix: '$',
                }),
            );
        }
    }, [gasPriceInGwei, ethMainnetUsdPrice]);

    const approvalButton = (
        <Button
            title={
                !isApprovalPending
                    ? `Approve ${tokenA.symbol}`
                    : `${tokenA.symbol} Approval Pending`
            }
            disabled={isApprovalPending}
            action={async () => {
                await approve(tokenA.address, tokenA.symbol);
            }}
            flat={true}
        />
    );

    const toggleDexSelection = (tokenAorB: 'A' | 'B') => {
        if (tokenAorB === 'A') {
            setIsWithdrawFromDexChecked(!isWithdrawFromDexChecked);
        } else {
            if (isSaveAsDexSurplusChecked) dexBalLimit.outputToDexBal.disable();
            else dexBalLimit.outputToDexBal.enable();
            setIsSaveAsDexSurplusChecked(!isSaveAsDexSurplusChecked);
        }
    };

    // TODO: @Emily refactor this to take a token data object
    // values if either token needs to be confirmed before transacting
    const needConfirmTokenA = !tokens.verifyToken(tokenA.address);
    const needConfirmTokenB = !tokens.verifyToken(tokenB.address);

    // value showing if no acknowledgement is necessary
    const areBothAckd: boolean = !needConfirmTokenA && !needConfirmTokenB;

    // logic to acknowledge one or both tokens as necessary
    const ackAsNeeded = (): void => {
        needConfirmTokenA && tokens.ackToken(tokenA);
        needConfirmTokenB && tokens.ackToken(tokenB);
    };

    const liquidityProviderFeeString = (
        tradeData.liquidityFee * 100
    ).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <TradeModuleSkeleton
            header={
                <TradeModuleHeader
                    slippage={mintSlippage}
                    bypassConfirm={bypassConfirmLimit}
                    settingsTitle='Limit Order'
                />
            }
            input={
                <LimitTokenInput
                    tokenAInputQty={{
                        value: tokenAInputQty,
                        set: setTokenAInputQty,
                    }}
                    tokenBInputQty={{
                        value: tokenBInputQty,
                        set: setTokenBInputQty,
                    }}
                    isSaveAsDexSurplusChecked={isSaveAsDexSurplusChecked}
                    isWithdrawFromDexChecked={isWithdrawFromDexChecked}
                    limitTickDisplayPrice={middleDisplayPrice}
                    handleLimitButtonMessage={handleLimitButtonMessage}
                    toggleDexSelection={toggleDexSelection}
                />
            }
            inputOptions={
                <LimitRate
                    previousDisplayPrice={previousDisplayPrice}
                    displayPrice={displayPrice}
                    setDisplayPrice={setDisplayPrice}
                    setPreviousDisplayPrice={setPreviousDisplayPrice}
                    isSellTokenBase={isSellTokenBase}
                    setPriceInputFieldBlurred={setPriceInputFieldBlurred}
                    fieldId='limit-rate'
                />
            }
            transactionDetails={
                <LimitExtraInfo
                    showExtraInfoDropdown={
                        tokenAInputQty !== '' || tokenBInputQty !== ''
                    }
                    orderGasPriceInDollars={orderGasPriceInDollars}
                    liquidityProviderFeeString={liquidityProviderFeeString}
                    isTokenABase={isSellTokenBase}
                    startDisplayPrice={startDisplayPrice}
                    middleDisplayPrice={middleDisplayPrice}
                    endDisplayPrice={endDisplayPrice}
                />
            }
            modal={
                isModalOpen ? (
                    <Modal
                        onClose={handleModalClose}
                        title='Limit Confirmation'
                        centeredTitle
                    >
                        <ConfirmLimitModal
                            initiateLimitOrderMethod={sendLimitOrder}
                            tokenAInputQty={tokenAInputQty}
                            tokenBInputQty={tokenBInputQty}
                            insideTickDisplayPrice={endDisplayPrice}
                            newLimitOrderTransactionHash={
                                newLimitOrderTransactionHash
                            }
                            txErrorCode={txErrorCode}
                            showConfirmation={showConfirmation}
                            setShowConfirmation={setShowConfirmation}
                            resetConfirmation={resetConfirmation}
                            startDisplayPrice={startDisplayPrice}
                            middleDisplayPrice={middleDisplayPrice}
                            endDisplayPrice={endDisplayPrice}
                        />
                    </Modal>
                ) : undefined
            }
            button={
                <Button
                    title={
                        areBothAckd
                            ? limitAllowed
                                ? bypassConfirmLimit.isEnabled
                                    ? 'Submit Limit Order'
                                    : 'Confirm'
                                : limitButtonErrorMessage
                            : 'Acknowledge'
                    }
                    action={
                        areBothAckd
                            ? bypassConfirmLimit.isEnabled
                                ? handleLimitButtonClickWithBypass
                                : openModal
                            : ackAsNeeded
                    }
                    disabled={
                        (!limitAllowed ||
                            !isOrderValid ||
                            poolPriceNonDisplay === 0) &&
                        areBothAckd
                    }
                    flat
                />
            }
            bypassConfirm={
                showBypassConfirmButton ? (
                    <BypassConfirmLimitButton
                        {...bypassConfirmLimitButtonProps}
                    />
                ) : undefined
            }
            approveButton={
                !isTokenAAllowanceSufficient && parseFloat(tokenAInputQty) > 0
                    ? approvalButton
                    : undefined
            }
            tutorialSteps={limitTutorialSteps}
        />
    );
}
