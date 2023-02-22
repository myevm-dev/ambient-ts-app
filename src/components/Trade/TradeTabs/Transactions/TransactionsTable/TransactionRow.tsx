import styles from '../Transactions.module.css';
import { setDataLoadingStatus } from '../../../../../utils/state/graphDataSlice';
import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { useProcessTransaction } from '../../../../../utils/hooks/useProcessTransaction';
import TransactionsMenu from '../../../../Global/Tabs/TableMenu/TableMenuComponents/TransactionsMenu';
import { DefaultTooltip } from '../../../../Global/StyledTooltip/StyledTooltip';
import { FiExternalLink } from 'react-icons/fi';

import { NavLink } from 'react-router-dom';
// import { AiOutlineDash } from 'react-icons/ai';
import NoTokenIcon from '../../../../Global/NoTokenIcon/NoTokenIcon';
import IconWithTooltip from '../../../../Global/IconWithTooltip/IconWithTooltip';
import TransactionDetails from '../../../../Global/TransactionDetails/TransactionDetails';
import { tradeData } from '../../../../../utils/state/tradeDataSlice';
import { useAppDispatch } from '../../../../../utils/hooks/reduxToolkit';
import moment from 'moment';
import { ZERO_ADDRESS } from '../../../../../constants';
import useOnClickOutside from '../../../../../utils/hooks/useOnClickOutside';
import { TransactionIF } from '../../../../../utils/interfaces/exports';
import useMediaQuery from '../../../../../utils/hooks/useMediaQuery';

interface propsIF {
    account: string;
    tx: TransactionIF;
    tradeData: tradeData;
    isTokenABase: boolean;
    currentTxActiveInTransactions: string;
    setCurrentTxActiveInTransactions: Dispatch<SetStateAction<string>>;
    isShowAllEnabled: boolean;
    showSidebar: boolean;
    ipadView: boolean;
    showPair: boolean;
    view2: boolean;
    showColumns: boolean;
    blockExplorer: string | undefined;
    closeGlobalModal: () => void;
    handlePulseAnimation?: (type: string) => void;

    openGlobalModal: (content: React.ReactNode) => void;
    isOnPortfolioPage: boolean;
}
export default function TransactionRow(props: propsIF) {
    const {
        account,
        showColumns,
        tradeData,
        ipadView,
        // view2,
        isTokenABase,
        tx,
        // showSidebar,
        blockExplorer,
        handlePulseAnimation,
        // openGlobalModal,
        // closeGlobalModal,
        currentTxActiveInTransactions,
        setCurrentTxActiveInTransactions,
        isShowAllEnabled,
        isOnPortfolioPage,
        closeGlobalModal,
        openGlobalModal,
        showPair,
        // showSidebar,
    } = props;

    const {
        txHash,
        txHashTruncated,
        userNameToDisplay,
        quoteTokenLogo,
        baseTokenLogo,
        baseDisplay,
        quoteDisplay,
        // isBaseFlowPositive,
        // isQuoteFlowPositive,
        // baseDisplayFrontend,
        // quoteDisplayFrontend,
        ownerId,
        // isOrderFilled,
        truncatedDisplayPrice,
        truncatedLowDisplayPrice,
        truncatedHighDisplayPrice,
        sideType,

        type,
        usdValue,
        txUsdValueLocaleString,
        baseTokenSymbol,
        baseTokenAddress,
        quoteTokenSymbol,
        quoteTokenAddress,
        isOwnerActiveAccount,
        ensName,
        baseTokenCharacter,
        quoteTokenCharacter,
        isDenomBase,
        truncatedDisplayPriceDenomByMoneyness,
        truncatedLowDisplayPriceDenomByMoneyness,
        truncatedHighDisplayPriceDenomByMoneyness,
        isBaseTokenMoneynessGreaterOrEqual,
        // orderMatchesSelectedTokens,
    } = useProcessTransaction(tx, account, isOnPortfolioPage);

    const dispatch = useAppDispatch();

    const sideCharacter = isOnPortfolioPage
        ? isBaseTokenMoneynessGreaterOrEqual
            ? quoteTokenCharacter
            : baseTokenCharacter
        : isDenomBase
        ? baseTokenCharacter
        : quoteTokenCharacter;

    const priceCharacter = isOnPortfolioPage
        ? isBaseTokenMoneynessGreaterOrEqual
            ? baseTokenCharacter
            : quoteTokenCharacter
        : !isDenomBase
        ? baseTokenCharacter
        : quoteTokenCharacter;

    const priceStyle = 'base_color';
    const sideTypeStyle = `${sideType}_style`;

    const phoneScreen = useMediaQuery('(max-width: 500px)');
    const smallScreen = useMediaQuery('(max-width: 720px)');

    const logoSizes = phoneScreen ? '10px' : smallScreen ? '15px' : '20px';

    const valueArrows = tx.entityType !== 'liqchange';
    // const valueArrows = sideType !== 'add' && sideType !== 'remove';

    const positiveArrow = '↑';
    // const positiveArrow = valueArrows && '↑';
    const negativeArrow = '↓';
    // const negativeArrow = valueArrows && '↓';
    // const baseFlowArrow =
    //     valueArrows && baseDisplay !== '0.00' ? (!isBaseFlowPositive ? '↑' : '↓') : null;
    // const quoteFlowArrow =
    //     valueArrows && quoteDisplay !== '0.00' ? (!isQuoteFlowPositive ? '↑' : '↓') : null;

    // const posOrNegativeBase = !isBaseFlowPositive ? styles.positive_value : styles.negative_value;
    // const posOrNegativeQuote = !isQuoteFlowPositive ? styles.positive_value : styles.negative_value;
    const isBuy = tx.isBuy === true || tx.isBid === true;

    const isSellQtyZero = (isBuy && tx.baseFlow === '0') || (!isBuy && tx.quoteFlow === '0');
    const isBuyQtyZero = (!isBuy && tx.baseFlow === '0') || (isBuy && tx.quoteFlow === '0');
    const isOrderRemove = tx.entityType === 'limitOrder' && sideType === 'remove';

    const positiveDisplayStyle =
        baseDisplay === '0.00' ||
        !valueArrows ||
        (isOrderRemove ? isSellQtyZero : isBuyQtyZero) ||
        tx.source === 'manual'
            ? styles.light_grey
            : styles.positive_value;
    // baseDisplay == '0.00' || !valueArrows ? styles.light_grey : styles.positive_value;
    const negativeDisplayStyle =
        quoteDisplay === '0.00' || !valueArrows || (isOrderRemove ? isBuyQtyZero : isSellQtyZero)
            ? styles.light_grey
            : styles.negative_value;
    // const baseDisplayStyle =
    //     baseDisplay == '0.00' || !valueArrows ? styles.light_grey : posOrNegativeBase;
    // const quoteDisplayStyle =
    //     quoteDisplay == '0.00' || !valueArrows ? styles.light_grey : posOrNegativeQuote;

    // console.log(baseDisplay);

    const openDetailsModal = () => {
        openGlobalModal(
            <TransactionDetails
                account={account}
                tx={tx}
                closeGlobalModal={closeGlobalModal}
                isBaseTokenMoneynessGreaterOrEqual={isBaseTokenMoneynessGreaterOrEqual}
                isOnPortfolioPage={isOnPortfolioPage}
            />,
        );
    };

    const activeTransactionStyle =
        tx.id === currentTxActiveInTransactions ? styles.active_transaction_style : '';

    const userPositionStyle =
        userNameToDisplay === 'You' && isShowAllEnabled ? styles.border_left : null;

    const usernameStyle = ensName || isOwnerActiveAccount ? 'gradient_text' : 'base_color';

    const txDomId = tx.id === currentTxActiveInTransactions ? `tx-${tx.id}` : '';

    function scrollToDiv() {
        const element = document.getElementById(txDomId);

        element?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }

    const activePositionRef = useRef(null);

    const clickOutsideHandler = () => {
        setCurrentTxActiveInTransactions('');
    };
    useOnClickOutside(activePositionRef, clickOutsideHandler);

    useEffect(() => {
        tx.id === currentTxActiveInTransactions ? scrollToDiv() : null;
    }, [currentTxActiveInTransactions]);

    function handleOpenExplorer() {
        if (tx && blockExplorer) {
            const explorerUrl = `${blockExplorer}tx/${tx.tx}`;
            window.open(explorerUrl);
        }
    }

    const IDWithTooltip = (
        <DefaultTooltip
            interactive
            title={
                <div onClick={handleOpenExplorer} style={{ cursor: 'pointer' }}>
                    {txHash + 'ㅤ'}
                    <FiExternalLink size={'12px'} />
                </div>
            } // invisible space character added
            placement={'right'}
            arrow
            enterDelay={750}
            leaveDelay={200}
        >
            <li
                onClick={openDetailsModal}
                data-label='id'
                className='base_color'
                style={{ fontFamily: 'monospace' }}
            >
                {txHashTruncated}
            </li>
        </DefaultTooltip>
    );

    const usdValueWithTooltip = (
        <DefaultTooltip
            interactive
            title={txUsdValueLocaleString}
            placement={'right-end'}
            arrow
            disableHoverListener={true}
            enterDelay={750}
            leaveDelay={200}
        >
            <li
                onClick={openDetailsModal}
                data-label='value'
                className='base_color'
                // className='gradient_text'
                style={{ textAlign: 'right', fontFamily: 'monospace' }}
            >
                {usdValue}
            </li>
        </DefaultTooltip>
    );

    const walletWithTooltip = (
        <DefaultTooltip
            interactive
            title={
                <div>
                    <NavLink
                        onClick={() => {
                            dispatch(
                                setDataLoadingStatus({
                                    datasetName: 'lookupUserTxData',
                                    loadingStatus: true,
                                }),
                            );
                        }}
                        to={`/${isOwnerActiveAccount ? 'account' : ensName ? ensName : ownerId}`}
                    >
                        <p>{ensName ? ensName : ownerId}</p>
                        {'View Account' + 'ㅤ'}
                        <FiExternalLink size={'12px'} />
                    </NavLink>
                </div>
            }
            placement={'right'}
            arrow
            enterDelay={750}
            leaveDelay={200}
        >
            <li
                onClick={openDetailsModal}
                data-label='wallet'
                className={usernameStyle}
                style={
                    userNameToDisplay !== 'You'
                        ? { textTransform: 'lowercase', fontFamily: 'monospace' }
                        : undefined
                }
            >
                {userNameToDisplay}
            </li>
        </DefaultTooltip>
    );

    const baseTokenLogoComponent =
        baseTokenLogo !== '' ? (
            <DefaultTooltip
                interactive
                title={
                    <div>
                        <p>
                            {baseTokenSymbol}
                            {`${baseTokenSymbol === 'ETH' ? '' : ': ' + baseTokenAddress}`}
                        </p>
                        {/* <NavLink to={`/${ownerId}`}>View Account</NavLink> */}
                    </div>
                }
                placement={'left'}
                disableHoverListener={!isOnPortfolioPage}
                arrow
                enterDelay={750}
                leaveDelay={200}
            >
                <img src={baseTokenLogo} alt='base token' width={logoSizes} />
            </DefaultTooltip>
        ) : (
            <IconWithTooltip title={`${baseTokenSymbol}: ${baseTokenAddress}`} placement='bottom'>
                <NoTokenIcon tokenInitial={tx.baseSymbol.charAt(0)} width={logoSizes} />
            </IconWithTooltip>
        );

    const quoteTokenLogoComponent =
        quoteTokenLogo !== '' ? (
            <DefaultTooltip
                interactive
                title={
                    <div>
                        <p>
                            {quoteTokenSymbol}: {quoteTokenAddress}
                        </p>
                        {/* <NavLink to={`/${ownerId}`}>View Account</NavLink> */}
                    </div>
                }
                placement={'left'}
                disableHoverListener={!isOnPortfolioPage}
                arrow
                enterDelay={750}
                leaveDelay={200}
            >
                <img src={quoteTokenLogo} alt='quote token' width={logoSizes} />
            </DefaultTooltip>
        ) : (
            <IconWithTooltip title={`${quoteTokenSymbol}: ${quoteTokenAddress}`} placement='right'>
                <NoTokenIcon tokenInitial={tx.quoteSymbol.charAt(0)} width={logoSizes} />
            </IconWithTooltip>
        );

    // const tokensTogether = (
    //     <div
    //         style={{
    //             display: 'flex',
    //             flexDirection: 'row',
    //             alignItems: 'center',
    //             gap: '4px',
    //         }}
    //     >
    //         {baseTokenLogoComponent}
    //         {quoteTokenLogoComponent}
    //     </div>
    // );

    // portfolio page li element ---------------
    // const accountTokenImages = <li className={styles.token_images_account}>{tokensTogether}</li>;

    // const poolName = (
    //     <li className='base_color'>
    //         {baseTokenSymbol} / {quoteTokenSymbol}
    //     </li>
    // );

    const pair =
        tx.base !== ZERO_ADDRESS
            ? [`${tx.baseSymbol}: ${tx.base}`, `${tx.quoteSymbol}: ${tx.quote}`]
            : [`${tx.quoteSymbol}: ${tx.quote}`];
    const tip = pair.join('\n');

    const tradeLinkPath =
        (tx.entityType.toLowerCase() === 'limitorder'
            ? '/trade/limit/'
            : tx.entityType.toLowerCase() === 'liqchange'
            ? '/trade/range/'
            : '/trade/market/') +
        'chain=' +
        tx.chainId +
        '&tokenA=' +
        tx.quote +
        '&tokenB=' +
        tx.base;

    const tokenPair = (
        <DefaultTooltip
            interactive
            title={<div style={{ whiteSpace: 'pre-line' }}>{tip}</div>}
            placement={'left'}
            arrow
            enterDelay={150}
            leaveDelay={200}
        >
            <li className='base_color'>
                {/* {tokensTogether} */}
                <NavLink
                    // onClick={() => {
                    //     console.log({ tx });
                    //     console.log({ tradeLinkPath });
                    // }}
                    to={tradeLinkPath}
                >
                    <p>
                        {baseTokenSymbol} / {quoteTokenSymbol}
                    </p>
                </NavLink>
            </li>
        </DefaultTooltip>
    );

    // const fillTime = new Intl.DateTimeFormat('en-US', {
    //     month: 'short',
    //     day: 'numeric',
    //     // hour12: false,
    //     // hour: '2-digit',
    //     // minute: '2-digit',
    // }).format(tx.time * 1000);

    // const txTimeInDays = moment(Date.now()).diff(tx.time * 1000, 'days');
    // const txTimeInHours = moment(Date.now()).diff(tx.time * 1000, 'hours');

    const elapsedTimeInSecondsNum = moment(Date.now()).diff(tx.time * 1000, 'seconds');

    // const txTimeDisplay =
    //     txTimeInDays === 0
    //         ? 'Today'
    //         : txTimeInDays === 1
    //         ? '1 day '
    //         : `${txTimeInDays} days `;

    const elapsedTimeString =
        elapsedTimeInSecondsNum !== undefined
            ? elapsedTimeInSecondsNum < 60
                ? '< 1 min. '
                : elapsedTimeInSecondsNum < 120
                ? '1 min. '
                : elapsedTimeInSecondsNum < 3600
                ? `${Math.floor(elapsedTimeInSecondsNum / 60)} min. `
                : elapsedTimeInSecondsNum < 7200
                ? '1 hour '
                : elapsedTimeInSecondsNum < 86400
                ? `${Math.floor(elapsedTimeInSecondsNum / 3600)} hrs. `
                : elapsedTimeInSecondsNum < 172800
                ? '1 day '
                : `${Math.floor(elapsedTimeInSecondsNum / 86400)} days `
            : 'Pending...';

    const TxTimeWithTooltip = (
        <DefaultTooltip
            interactive
            title={moment(tx.time * 1000).format('MM/DD/YYYY HH:mm')}
            placement={'left'}
            arrow
            enterDelay={750}
            leaveDelay={200}
        >
            <li onClick={openDetailsModal} style={{ textTransform: 'lowercase' }}>
                <p className='base_color' style={{ fontFamily: 'monospace' }}>
                    {elapsedTimeString}
                </p>
                {/* <p className='base_color'> Nov 9 10:36:23 AM</p> */}
            </li>
        </DefaultTooltip>
    );
    // const baseQtyToolTipStyle = <p className={styles.tooltip_style}>{baseTokenSymbol + ' Qty'}</p>;
    // const quoteQtyToolTipStyle = (
    //     <p className={styles.tooltip_style}>{quoteTokenSymbol + ' Qty'}</p>
    // );
    const baseQtyDisplayWithTooltip = (
        // <DefaultTooltip
        //     interactive
        //     title={baseQtyToolTipStyle}
        //     placement={'right'}
        //     arrow
        //     enterDelay={150}
        //     leaveDelay={200}
        // >
        <li onClick={openDetailsModal} data-label={baseTokenSymbol} className='base_color'>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                }}
            >
                {baseDisplay}
                {baseTokenLogoComponent}
                {/* {<img src={baseTokenLogo} width='15px' alt='' />} */}
                {/* {isOnPortfolioPage && <img src={baseTokenLogo} width='15px' alt='' />} */}
            </div>
        </li>
        /* </DefaultTooltip> */
    );
    const quoteQtyDisplayWithTooltip = (
        // <DefaultTooltip
        //     interactive
        //     title={quoteQtyToolTipStyle}
        //     placement={'right'}
        //     arrow
        //     enterDelay={150}
        //     leaveDelay={200}
        // >
        <li onClick={openDetailsModal} data-label={quoteTokenSymbol} className='base_color'>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                }}
            >
                {quoteDisplay}
                {/* {<img src={quoteTokenLogo} width='15px' alt='' />} */}
                {quoteTokenLogoComponent}
                {/* {isOnPortfolioPage && <img src={quoteTokenLogo} width='15px' alt='' />} */}
            </div>
        </li>
        /* </DefaultTooltip> */
    );

    // end of portfolio page li element ---------------
    return (
        <ul
            className={`${styles.row_container} ${activeTransactionStyle} ${userPositionStyle}`}
            style={{ cursor: 'pointer' }}
            onClick={() =>
                tx.id === currentTxActiveInTransactions
                    ? null
                    : setCurrentTxActiveInTransactions('')
            }
            id={txDomId}
            ref={currentTxActiveInTransactions ? activePositionRef : null}
        >
            {!showColumns && TxTimeWithTooltip}
            {isOnPortfolioPage && showPair && tokenPair}
            {/* {isOnPortfolioPage && !showSidebar && poolName} */}
            {!showColumns && IDWithTooltip}
            {!showColumns && !isOnPortfolioPage && walletWithTooltip}
            {showColumns && (
                <DefaultTooltip
                    interactive
                    title={
                        <div>
                            <NavLink
                                onClick={() => {
                                    dispatch(
                                        setDataLoadingStatus({
                                            datasetName: 'lookupUserTxData',
                                            loadingStatus: true,
                                        }),
                                    );
                                }}
                                to={`/${
                                    isOwnerActiveAccount ? 'account' : ensName ? ensName : ownerId
                                }`}
                            >
                                <p>{ensName ? ensName : ownerId}</p>
                                {'View Account' + 'ㅤ'}
                                <FiExternalLink size={'12px'} />
                            </NavLink>
                        </div>
                    }
                    placement={'right'}
                    arrow
                    enterDelay={750}
                    leaveDelay={200}
                >
                    <li data-label='id' onClick={openDetailsModal}>
                        <p className='base_color'>{txHashTruncated}</p>{' '}
                        <p className={usernameStyle} style={{ textTransform: 'lowercase' }}>
                            {userNameToDisplay}
                        </p>
                    </li>
                </DefaultTooltip>
            )}
            {!ipadView &&
                (tx.entityType === 'liqchange' ? (
                    tx.positionType === 'ambient' ? (
                        <li
                            onClick={openDetailsModal}
                            data-label='price'
                            className={'gradient_text'}
                            style={{
                                textAlign: 'right',
                                fontFamily: 'monospace',
                                textTransform: 'lowercase',
                            }}
                        >
                            ambient
                        </li>
                    ) : (
                        <li
                            onClick={openDetailsModal}
                            data-label='price'
                            className={`${priceStyle}`}
                        >
                            <p className={`${styles.align_right} `}>
                                <span>{truncatedLowDisplayPrice ? priceCharacter : '…'}</span>
                                <span style={{ fontFamily: 'monospace' }}>
                                    {isOnPortfolioPage
                                        ? truncatedLowDisplayPriceDenomByMoneyness
                                        : truncatedLowDisplayPrice}
                                </span>
                            </p>
                            <p className={`${styles.align_right} `}>
                                <span>{truncatedHighDisplayPrice ? priceCharacter : '…'}</span>
                                <span style={{ fontFamily: 'monospace' }}>
                                    {isOnPortfolioPage
                                        ? truncatedHighDisplayPriceDenomByMoneyness
                                        : truncatedHighDisplayPrice}
                                </span>
                            </p>
                        </li>
                    )
                ) : (
                    <li
                        onClick={() => {
                            console.log({ isOnPortfolioPage });
                            console.log({ truncatedDisplayPriceDenomByMoneyness });
                            openDetailsModal();
                        }}
                        data-label='price'
                        className={`${styles.align_right}  ${priceStyle}`}
                        style={{ fontFamily: 'monospace' }}
                    >
                        {isOnPortfolioPage
                            ? (
                                  <p className={`${styles.align_right} `}>
                                      <span>
                                          {truncatedDisplayPriceDenomByMoneyness
                                              ? priceCharacter
                                              : '…'}
                                      </span>
                                      <span style={{ fontFamily: 'monospace' }}>
                                          {truncatedDisplayPriceDenomByMoneyness}
                                      </span>
                                  </p>
                              ) || '…'
                            : (
                                  <p className={`${styles.align_right} `}>
                                      <span>{truncatedDisplayPrice ? priceCharacter : '…'}</span>
                                      <span style={{ fontFamily: 'monospace' }}>
                                          {truncatedDisplayPrice}
                                      </span>
                                  </p>
                              ) || '…'}
                    </li>
                ))}
            {!showColumns && (
                <li
                    onClick={openDetailsModal}
                    data-label='side'
                    className={sideTypeStyle}
                    style={{ textAlign: 'center' }}
                >
                    {tx.entityType === 'liqchange' || tx.entityType === 'limitOrder'
                        ? `${sideType}`
                        : `${sideType} ${sideCharacter}`}
                </li>
            )}
            {!showColumns && (
                <li
                    onClick={openDetailsModal}
                    data-label='type'
                    className={sideTypeStyle}
                    style={{ textAlign: 'center' }}
                >
                    {type}
                </li>
            )}
            {showColumns && !ipadView && (
                <li
                    data-label='side-type'
                    className={sideTypeStyle}
                    style={{ textAlign: 'center' }}
                    onClick={openDetailsModal}
                >
                    <p>{type}</p>
                    <p>
                        {tx.entityType === 'liqchange' || tx.entityType === 'limitOrder'
                            ? `${sideType}`
                            : `${sideType} ${sideCharacter}`}
                    </p>
                </li>
            )}
            {usdValueWithTooltip}
            {!showColumns && baseQtyDisplayWithTooltip}
            {!showColumns && quoteQtyDisplayWithTooltip}
            {showColumns && (
                <li
                    data-label={baseTokenSymbol + quoteTokenSymbol}
                    className='color_white'
                    style={{ textAlign: 'right' }}
                    onClick={() => {
                        // console.log({ isBuy });
                        // console.log({ isOrderRemove });
                        // console.log({ baseDisplay });
                        // console.log({ quoteDisplay });
                        openDetailsModal();
                    }}
                >
                    <div
                        className={`${styles.token_qty} ${positiveDisplayStyle}`}
                        style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                    >
                        {isBuy
                            ? isOrderRemove
                                ? baseDisplay
                                : quoteDisplay
                            : isOrderRemove
                            ? quoteDisplay
                            : baseDisplay}
                        {valueArrows ? positiveArrow : ' '}
                        {/* {isBuy ? quoteFlowArrow : baseFlowArrow} */}
                        {isBuy
                            ? isOrderRemove
                                ? baseTokenLogoComponent
                                : quoteTokenLogoComponent
                            : isOrderRemove
                            ? quoteTokenLogoComponent
                            : baseTokenLogoComponent}
                    </div>

                    <div
                        className={`${styles.token_qty} ${negativeDisplayStyle}`}
                        style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                    >
                        {isBuy
                            ? `${isOrderRemove ? quoteDisplay : baseDisplay}${
                                  valueArrows ? negativeArrow : ' '
                              }`
                            : `${isOrderRemove ? baseDisplay : quoteDisplay}${
                                  valueArrows ? negativeArrow : ' '
                              }`}
                        {/* {isBuy ? baseFlowArrow : quoteFlowArrow} */}
                        {isBuy
                            ? isOrderRemove
                                ? quoteTokenLogoComponent
                                : baseTokenLogoComponent
                            : isOrderRemove
                            ? baseTokenLogoComponent
                            : quoteTokenLogoComponent}
                    </div>
                </li>
            )}
            <li data-label='menu' className={styles.menu}>
                <TransactionsMenu
                    account={account}
                    userPosition={userNameToDisplay === 'You'}
                    tx={tx}
                    tradeData={tradeData}
                    isTokenABase={isTokenABase}
                    blockExplorer={blockExplorer}
                    showSidebar={props.showSidebar}
                    openGlobalModal={props.openGlobalModal}
                    closeGlobalModal={props.closeGlobalModal}
                    isOnPortfolioPage={props.isOnPortfolioPage}
                    handlePulseAnimation={handlePulseAnimation}
                    isBaseTokenMoneynessGreaterOrEqual={isBaseTokenMoneynessGreaterOrEqual}
                />
            </li>
        </ul>
    );
}
