// START: Import React and Dongles
import { Dispatch, SetStateAction, useState } from 'react';
import { CrocImpact } from '@crocswap-libs/sdk';

// START: Import JSX Components
import WaitingConfirmation from '../../Global/WaitingConfirmation/WaitingConfirmation';
import TransactionSubmitted from '../../Global/TransactionSubmitted/TransactionSubmitted';
import TransactionDenied from '../../Global/TransactionDenied/TransactionDenied';
import TransactionException from '../../Global/TransactionException/TransactionException';
import Button from '../../Global/Button/Button';
import TokensArrow from '../../Global/TokensArrow/TokensArrow';
import InitPoolDenom from '../../InitPool/InitPoolDenom/InitPoolDenom';
import NoTokenIcon from '../../Global/NoTokenIcon/NoTokenIcon';
import ConfirmationModalControl from '../../Global/ConfirmationModalControl/ConfirmationModalControl';

// START: Import Other Local Files
import styles from './ConfirmSwapModal.module.css';
import { TokenPairIF } from '../../../utils/interfaces/exports';
import {
    allSkipConfirmMethodsIF,
    skipConfirmIF,
} from '../../../App/hooks/useSkipConfirm';

interface propsIF {
    initiateSwapMethod: () => void;
    poolPriceDisplay: number | undefined;
    isDenomBase: boolean;
    baseTokenSymbol: string;
    quoteTokenSymbol: string;
    priceImpact: CrocImpact | undefined;
    onClose: () => void;
    newSwapTransactionHash: string;
    tokenPair: TokenPairIF;
    txErrorCode: string;
    txErrorMessage: string;
    showConfirmation: boolean;
    setShowConfirmation: Dispatch<SetStateAction<boolean>>;
    resetConfirmation: () => void;
    slippageTolerancePercentage: number;
    effectivePrice: number;
    isSellTokenBase: boolean;
    sellQtyString: string;
    buyQtyString: string;
    bypassConfirmSwap: skipConfirmIF;
    bypassConfirm: allSkipConfirmMethodsIF;
}

export default function ConfirmSwapModal(props: propsIF) {
    const {
        initiateSwapMethod,
        isDenomBase,
        poolPriceDisplay,
        baseTokenSymbol,
        quoteTokenSymbol,
        newSwapTransactionHash,
        tokenPair,
        txErrorCode,
        resetConfirmation,
        showConfirmation,
        setShowConfirmation,
        slippageTolerancePercentage,
        effectivePrice,
        isSellTokenBase,
        sellQtyString,
        buyQtyString,
        bypassConfirmSwap,
        bypassConfirm,
    } = props;

    const transactionApproved = newSwapTransactionHash !== '';
    const isTransactionDenied = txErrorCode === 'ACTION_REJECTED';
    const isTransactionException = txErrorCode === 'CALL_EXCEPTION';
    const isGasLimitException = txErrorCode === 'UNPREDICTABLE_GAS_LIMIT';
    const isInsufficientFundsException = txErrorCode === 'INSUFFICIENT_FUNDS';

    const sellTokenData = tokenPair.dataTokenA;

    const buyTokenData = tokenPair.dataTokenB;

    const [isDenomBaseLocal, setIsDenomBaseLocal] = useState(isDenomBase);

    const isPriceInverted =
        (isDenomBaseLocal && !isSellTokenBase) ||
        (!isDenomBaseLocal && isSellTokenBase);

    const effectivePriceWithDenom = effectivePrice
        ? isPriceInverted
            ? 1 / effectivePrice
            : effectivePrice
        : undefined;

    const displayEffectivePriceString =
        !effectivePriceWithDenom ||
        effectivePriceWithDenom === Infinity ||
        effectivePriceWithDenom === 0
            ? '…'
            : effectivePriceWithDenom < 2
            ? effectivePriceWithDenom.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
              })
            : effectivePriceWithDenom.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              });

    const displayPriceWithDenom = poolPriceDisplay
        ? isDenomBase
            ? 1 / poolPriceDisplay
            : poolPriceDisplay
        : undefined;
    // eslint-disable-next-line
    const displayConversionRate = displayPriceWithDenom
        ? displayPriceWithDenom < 2
            ? displayPriceWithDenom.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
              })
            : displayPriceWithDenom.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })
        : '...';

    const buyCurrencyRow = (
        <div className={styles.currency_row_container}>
            <h2>{buyQtyString}</h2>

            <div className={styles.logo_display}>
                {buyTokenData.logoURI ? (
                    <img src={buyTokenData.logoURI} alt={buyTokenData.symbol} />
                ) : (
                    <NoTokenIcon
                        tokenInitial={buyTokenData.symbol.charAt(0)}
                        width='30px'
                    />
                )}

                <h2>{buyTokenData.symbol}</h2>
            </div>
        </div>
    );

    const sellCurrencyRow = (
        <div className={styles.currency_row_container}>
            <h2>{sellQtyString}</h2>
            <div className={styles.logo_display}>
                {sellTokenData.logoURI ? (
                    <img
                        src={sellTokenData.logoURI}
                        alt={sellTokenData.symbol}
                    />
                ) : (
                    <NoTokenIcon
                        tokenInitial={sellTokenData.symbol.charAt(0)}
                        width='30px'
                    />
                )}

                <h2>{sellTokenData.symbol}</h2>
            </div>
        </div>
    );

    const toggleFor = 'swap';

    const [tempBypassConfirm, setTempBypassConfirm] = useState<boolean>(
        bypassConfirm.swap.isEnabled,
    );

    const fullTxDetails2 = (
        <div className={styles.main_container}>
            <section>
                {sellCurrencyRow}
                <div className={styles.arrow_container}>
                    <TokensArrow />
                </div>
                {buyCurrencyRow}
            </section>
            <InitPoolDenom
                setIsDenomBase={setIsDenomBaseLocal}
                isDenomBase={isDenomBaseLocal}
            />
            <div className={styles.extra_info_container}>
                <div className={styles.row}>
                    <p>Expected Output</p>
                    <p>
                        {buyQtyString} {buyTokenData.symbol}
                    </p>
                </div>
                <div className={styles.row}>
                    <p>Effective Conversion Rate</p>
                    <p>
                        {isDenomBaseLocal
                            ? `${displayEffectivePriceString} ${quoteTokenSymbol} per ${baseTokenSymbol}`
                            : `${displayEffectivePriceString} ${baseTokenSymbol} per ${quoteTokenSymbol}`}
                    </p>
                </div>
                <div className={styles.row}>
                    <p>Slippage Tolerance</p>
                    <p>{slippageTolerancePercentage}%</p>
                </div>
            </div>
            <ConfirmationModalControl
                tempBypassConfirm={tempBypassConfirm}
                setTempBypassConfirm={setTempBypassConfirm}
                toggleFor={toggleFor}
            />
        </div>
    );

    // REGULAR CONFIRMATION MESSAGE STARTS HERE
    const confirmSendMessage = (
        <WaitingConfirmation
            content={`Swapping ${sellQtyString} ${
                sellTokenData.symbol
            } for ${buyQtyString} ${
                buyTokenData.symbol
            }. Please check the ${'Metamask'} extension in your browser for notifications.
            `}
        />
    );

    const transactionDenied = (
        <TransactionDenied resetConfirmation={resetConfirmation} />
    );
    const transactionException = (
        <TransactionException resetConfirmation={resetConfirmation} />
    );

    const transactionSubmitted = (
        <TransactionSubmitted
            hash={newSwapTransactionHash}
            tokenBSymbol={buyTokenData.symbol}
            tokenBAddress={buyTokenData.address}
            tokenBDecimals={buyTokenData.decimals}
            tokenBImage={buyTokenData.logoURI}
        />
    );

    // END OF REGULAR CONFIRMATION MESSAGE

    const confirmationDisplay =
        isTransactionException ||
        isGasLimitException ||
        isInsufficientFundsException
            ? transactionException
            : isTransactionDenied
            ? transactionDenied
            : transactionApproved
            ? transactionSubmitted
            : confirmSendMessage;

    return (
        <div className={styles.modal_container}>
            <section className={styles.modal_content}>
                {showConfirmation ? fullTxDetails2 : confirmationDisplay}
            </section>
            <footer className={styles.modal_footer}>
                {showConfirmation && (
                    <Button
                        title='Send Swap'
                        action={() => {
                            bypassConfirmSwap.setValue(tempBypassConfirm);
                            initiateSwapMethod();
                            setShowConfirmation(false);
                        }}
                        flat
                    />
                )}
            </footer>
        </div>
    );
}
