import { LevelWrapper } from '../../../../../styled/Components/Header';

import UserProfileCard from '../UserProfileCard';
import LevelsCard from '../../../../../components/Global/LevelsCard/LevelsCard';
interface LevelDropdownPropsIF {
    ensName: string;
    accountAddress: string;
    handleCopyAddress: () => void;
    accountAddressFull: string;
}

export default function LevelDropdown(props: LevelDropdownPropsIF) {
    const { ensName, handleCopyAddress } = props;

    return (
        <LevelWrapper>
            <UserProfileCard
                ensName={ensName !== '' ? ensName : ''}
                accountAddress={props.accountAddress}
                handleCopyAddress={handleCopyAddress}
                accountAddressFull={props.accountAddressFull}
            />
            <LevelsCard levelOnly />
        </LevelWrapper>
    );
}
