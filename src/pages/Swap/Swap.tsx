import CurrencyConverter from '../../components/Swap/CurrencyConverter/CurrencyConverter';
import ExtraInfo from '../../components/Swap/ExtraInfo/ExtraInfo';
import ContentContainer from '../../components/Global/ContentContainer/ContentContainer';
import SwapHeader from '../../components/Swap/SwapHeader/SwapHeader';
import SwapButton from '../../components/Swap/SwapButton/SwapButton';
import { useEffect, useState } from 'react';
import {
    contractAddresses,
    getSpotPrice,
    getSpotPriceDisplay,
    POOL_PRIMARY,
    sendSwap,
    parseSwapEthersReceipt,
    // toFixedNumber,
    EthersNativeReceipt,
    // ParsedSwapReceipt,
} from '@crocswap-libs/sdk';

import { JsonRpcProvider } from '@ethersproject/providers';

import { useMoralis } from 'react-moralis';
// import { logger } from 'ethers';

// import getContractEthDiff from '../../utils/EthDiff';
import { handleParsedReceipt } from '../../utils/HandleParsedReceipt';
import truncateDecimals from '../../utils/data/truncateDecimals';

import {
    // isTransactionFailedError,
    isTransactionReplacedError,
    TransactionError,
} from '../../utils/TransactionError';
import DenominationSwitch from '../../components/Swap/DenominationSwitch/DenomicationSwitch';

interface ISwapProps {
    provider: JsonRpcProvider;
    isOnTradeRoute?: boolean;
}

export default function Swap(props: ISwapProps) {
    const { provider, isOnTradeRoute } = props;

    // console.log(props);

    const { Moralis } = useMoralis();

    const [isSellTokenPrimary, setIsSellTokenPrimary] = useState<boolean>(true);

    // const sellTokenAddress = contractAddresses.ZERO_ADDR;
    const daiKovanAddress = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa';
    // const usdcKovanAddress = '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede';
    // const buyTokenAddress = daiKovanAddress;

    const [poolPriceNonDisplay, setPoolPriceNonDisplay] = useState(0);

    useEffect(() => {
        (async () => {
            const spotPrice = await getSpotPrice(
                contractAddresses.ZERO_ADDR,
                daiKovanAddress,
                // usdcKovanAddress,
                POOL_PRIMARY,
                provider,
            );
            if (poolPriceNonDisplay !== spotPrice) {
                setPoolPriceNonDisplay(spotPrice);
            }
        })();
    }, []);

    useEffect(() => {
        console.log({ poolPriceNonDisplay });
    }, [poolPriceNonDisplay]);

    const [poolPriceDisplay, setPoolPriceDisplay] = useState(0);

    useEffect(() => {
        (async () => {
            const spotPriceDisplay = await getSpotPriceDisplay(
                contractAddresses.ZERO_ADDR,
                daiKovanAddress,
                // usdcKovanAddress,
                POOL_PRIMARY,
                provider,
            );
            if (poolPriceDisplay !== spotPriceDisplay) {
                setPoolPriceDisplay(spotPriceDisplay);
            }
        })();
    }, []);

    useEffect(() => {
        console.log({ poolPriceDisplay });
    }, [poolPriceDisplay]);

    const signer = provider?.getSigner();

    // const truncateDecimals = (number: number, decimalPlaces: number) => {
    //     const truncatedNumber = number % 1 ? number.toFixed(decimalPlaces) : number;
    //     return truncatedNumber;
    // };

    // const getContractEthDiff = async (txHash: string) => {
    //     const params = { txHash: txHash };
    //     const contractEthDiff = await Moralis.Cloud.run('getContractEthDiff', params);
    //     return contractEthDiff;
    // };

    async function initiateSwap() {
        const sellTokenAddress = contractAddresses.ZERO_ADDR;
        const buyTokenAddress = daiKovanAddress;
        const poolId = POOL_PRIMARY;
        const slippageTolerancePercentage = 5;
        const sellTokenQty = (document.getElementById('sell-quantity') as HTMLInputElement)?.value;
        const buyTokenQty = (document.getElementById('buy-quantity') as HTMLInputElement)?.value;
        const qty = isSellTokenPrimary ? sellTokenQty : buyTokenQty;

        let ethValue = '0'; // Overwritten by a non-zero value when the user is selling ETH for another token

        // if the user is selling ETH and requesting an exact output quantity
        // then pad the amount of ETH sent to the contract by 2% (the remainder will be automatically returned)
        if (sellTokenAddress === contractAddresses.ZERO_ADDR) {
            const roundedUpEthValue = truncateDecimals(
                parseFloat(sellTokenQty) * 1.02,
                18,
            ).toString();
            isSellTokenPrimary ? (ethValue = sellTokenQty) : (ethValue = roundedUpEthValue);
        }

        if (signer) {
            const tx = await sendSwap(
                sellTokenAddress,
                buyTokenAddress,
                isSellTokenPrimary,
                qty,
                ethValue,
                slippageTolerancePercentage,
                poolId,
                signer,
            );

            let newTransactionHash = tx.hash;
            let parsedReceipt;

            console.log({ newTransactionHash });

            try {
                const receipt = await tx.wait();
                console.log({ receipt });
                parsedReceipt = await parseSwapEthersReceipt(
                    provider,
                    receipt as EthersNativeReceipt,
                );
            } catch (e) {
                const error = e as TransactionError;
                if (isTransactionReplacedError(error)) {
                    // The user used "speed up" or something similar
                    // in their client, but we now have the updated info

                    // dispatch(removePendingTx(tx.hash));
                    console.log('repriced');
                    newTransactionHash = error.replacement.hash;
                    console.log({ newTransactionHash });
                    // dispatch(setCurrentTxHash(replacementTxHash));
                    // dispatch(addPendingTx(replacementTxHash));

                    parsedReceipt = await parseSwapEthersReceipt(
                        provider,
                        error.receipt as EthersNativeReceipt,
                    );
                }
            }
            if (parsedReceipt)
                handleParsedReceipt(Moralis, 'swap', newTransactionHash, parsedReceipt);
        }
    }

    return (
        <main data-testid={'swap'}>
            <ContentContainer isOnTradeRoute={isOnTradeRoute}>
                <SwapHeader isOnTradeRoute={isOnTradeRoute} />
                <DenominationSwitch />
                <CurrencyConverter
                    isLiq={false}
                    poolPrice={poolPriceNonDisplay}
                    setIsSellTokenPrimary={setIsSellTokenPrimary}
                />
                <ExtraInfo
                    poolPriceDisplay={poolPriceDisplay}
                    slippageTolerance={5}
                    liquidityProviderFee={0.3}
                    quoteTokenIsBuy={true}
                />
                <SwapButton onClickFn={initiateSwap} />
            </ContentContainer>
        </main>
    );
}
