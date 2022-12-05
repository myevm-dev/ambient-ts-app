import styles from './NotificationCenter.module.css';
import { AnimateSharedLayout } from 'framer-motion';
import { Dispatch, SetStateAction, useRef } from 'react';
import NotificationTable from './NotificationTable/NotificationTable';
import ActivityIndicator from './ActivityIndicator/ActivityIndicator';
import { useAppSelector } from '../../../utils/hooks/reduxToolkit';
import UseOnClickOutside from '../../../utils/hooks/useOnClickOutside';

interface NotificationCenterPropsIF {
    showNotificationTable: boolean;
    setShowNotificationTable: Dispatch<SetStateAction<boolean>>;
    lastBlockNumber: number;
}

const NotificationCenter = (props: NotificationCenterPropsIF) => {
    const { showNotificationTable, setShowNotificationTable, lastBlockNumber } = props;

    const receiptData = useAppSelector((state) => state.receiptData);

    const pendingTransactions = receiptData.pendingTransactions;

    const sessionReceipts = receiptData.sessionReceipts;

    const receiveReceiptHashes: Array<string> = [];
    // eslint-disable-next-line
    function handleParseReceipt(receipt: any) {
        const parseReceipt = JSON.parse(receipt);
        receiveReceiptHashes.push(parseReceipt?.transactionHash);
    }
    sessionReceipts.map((receipt) => handleParseReceipt(receipt));

    const currentPendingTransactionsArray = pendingTransactions.filter(
        (hash: string) => !receiveReceiptHashes.includes(hash),
    );
    const notificationItemRef = useRef<HTMLDivElement>(null);

    const clickOutsideHandler = () => {
        setShowNotificationTable(false);
    };
    UseOnClickOutside(notificationItemRef, clickOutsideHandler);

    return (
        <AnimateSharedLayout>
            <div className={styles.container}>
                <ActivityIndicator
                    value={receiveReceiptHashes.length}
                    pending={currentPendingTransactionsArray.length > 0}
                    showNotificationTable={showNotificationTable}
                    setShowNotificationTable={setShowNotificationTable}
                />
                <div ref={notificationItemRef}>
                    <NotificationTable
                        showNotificationTable={showNotificationTable}
                        setShowNotificationTable={setShowNotificationTable}
                        pendingTransactions={currentPendingTransactionsArray}
                        lastBlockNumber={lastBlockNumber}
                    />
                </div>
            </div>
        </AnimateSharedLayout>
    );
};

export default NotificationCenter;
