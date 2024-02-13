// import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import DropdownMenu2 from '../../../../components/Global/DropdownMenu2/DropdownMenu2';
import { ItemEnterAnimation } from '../../../../utils/others/FramerMotionAnimations';
import { useContext } from 'react';
import { CrocEnvContext } from '../../../../contexts/CrocEnvContext';
import {
    MenuContent,
    ChainNameStatus,
    NetworkItem,
    DropdownMenuContainer,
} from '../../../../styled/Components/Header';
import {
    supportedNetworks,
    INCLUDE_CANTO_LINK,
} from '../../../../ambient-utils/constants';
import { ChainSpec } from '@crocswap-libs/sdk';
import { useSearchParams } from 'react-router-dom';
import {
    linkGenMethodsIF,
    useLinkGen,
} from '../../../../utils/hooks/useLinkGen';
import { Text } from '../../../../styled/Common';
import { RiExternalLinkLine } from 'react-icons/ri';
import cantoLogo from '../../../../assets/images/networks/canto.png';
import scrollLogo from '../../../../assets/images/networks/scroll.png';
import ETH from '../../../../assets/images/tokens/ETH.png';

interface propsIF {
    switchNetwork: ((chainId_?: number | undefined) => void) | undefined;
}

export default function NetworkSelector(props: propsIF) {
    const { switchNetwork } = props;
    const {
        chooseNetwork,
        chainData: { chainId },
    } = useContext(CrocEnvContext);

    const linkGenIndex: linkGenMethodsIF = useLinkGen('index');
    const [searchParams] = useSearchParams();
    const chainParam = searchParams.get('chain');
    const networkParam = searchParams.get('network');

    // const chains: ChainSpec[] = getSupportedChainIds().map((chain: string) =>
    //     lookupChain(chain),
    // );

    // temporarily hardcoded mock blast chain data
    const chains = [
        {
            nodeUrl: 'https://rpc.scroll.io',
            addrs: {
                dex: '0xaaaaAAAACB71BF2C8CaE522EA5fa455571A74106',
                query: '0x62223e90605845Cf5CC6DAE6E0de4CDA130d6DDf',
                impact: '0xc2c301759B5e0C385a38e678014868A33E2F3ae3',
            },
            poolIndex: 420,
            isTestNet: false,
            chainId: '0x82750',
            gridSize: 4,
            proxyPaths: {
                cold: 3,
                long: 130,
                liq: 128,
            },
            blockExplorer: 'https://scrollscan.com/',
            displayName: 'Blast',
            logoUrl:
                'https://deploy-preview-3380--ambient-finance.netlify.app/blast_logo.jpeg',
        },
    ];

    // organize chain data into a hashmap for easier access in the file
    const chainMap = new Map();
    chains.forEach((chain: ChainSpec) => chainMap.set(chain.chainId, chain));

    // click handler for network switching (does not handle Canto link)
    function handleClick(chn: ChainSpec): void {
        if (switchNetwork) {
            switchNetwork(parseInt(chn.chainId));
            if (chainParam || networkParam) {
                // navigate to index page only if chain/network search param present
                linkGenIndex.navigate();
            }
        } else {
            if (chainParam || networkParam) {
                // navigate to index page only if chain/network search param present
                linkGenIndex.navigate();
            }
            chooseNetwork(supportedNetworks[chn.chainId]);
        }
    }

    // !important:  network data is manually coded because the data used to generate
    // !important:  ... elements does not follow a consistent shape (due to Canto)

    // JSX element to select ethereum mainnet network
    const ethereumNetwork: JSX.Element = (
        <NetworkItem
            id='ethereum_network_selector'
            onClick={() => handleClick(chainMap.get('0x1'))}
            key='ethereum'
            custom={0}
            variants={ItemEnterAnimation}
            tabIndex={0}
        >
            <ChainNameStatus tabIndex={0} active={chainId === '0x1'}>
                <img
                    src={ETH}
                    alt='ethereum mainnet network'
                    width='21px'
                    height='21px'
                    style={{ borderRadius: '50%' }}
                />
                <Text color={chainId === '0x1' ? 'accent1' : 'white'}>
                    Ethereum
                </Text>
            </ChainNameStatus>
        </NetworkItem>
    );

    // temporary hardcoded mock blast network data
    const scrollNetwork: JSX.Element = (
        <NetworkItem
            id='scroll_network_selector'
            onClick={() => handleClick(chainMap.get('0x82750'))}
            key='scroll'
            custom={0}
            variants={ItemEnterAnimation}
            tabIndex={0}
        >
            <ChainNameStatus tabIndex={0} active={chainId === '0x82750'}>
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='21px'
                    height='21px'
                    viewBox='0 0 20 14'
                    fill='none'
                >
                    <path
                        d='M15.7589 6.99084L18.9128 5.41927L20 2.08235L17.8256 0.5H3.34769L0 2.98654H17.0183L16.1141 5.78525H9.28956L8.63294 7.83045H15.4575L13.5414 13.7185L16.7384 12.1362L17.8794 8.60548L15.7374 7.0339L15.7589 6.99084Z'
                        fill='#FCFC03'
                    />
                    <path
                        d='M4.81162 11.1889L6.78148 5.05331L4.59633 3.41714L1.31323 13.7185H13.5414L14.3595 11.1889H4.81162Z'
                        fill='#FCFC03'
                    />
                </svg>

                <Text color={chainId === '0x82750' ? 'accent1' : 'white'}>
                    {' Blast'}
                </Text>
            </ChainNameStatus>
        </NetworkItem>
    );

    // // JSX element to select scroll network
    // const scrollNetwork: JSX.Element = (
    //     <NetworkItem
    //         id='scroll_network_selector'
    //         onClick={() => handleClick(chainMap.get('0x82750'))}
    //         key='scroll'
    //         custom={0}
    //         variants={ItemEnterAnimation}
    //         tabIndex={0}
    //     >
    //         <ChainNameStatus tabIndex={0} active={chainId === '0x82750'}>

    //             <img
    //                 src={scrollLogo}
    //                 alt='scroll network'
    //                 width='21px'
    //                 height='21px'
    //                 style={{ borderRadius: '50%' }}
    //             />
    //             <Text color={chainId === '0x82750' ? 'accent1' : 'white'}>
    //                 {'Scroll'}
    //             </Text>
    //         </ChainNameStatus>
    //     </NetworkItem>
    // );

    // JSX element to select canto network (external link)
    const cantoNetwork: JSX.Element = (
        <NetworkItem
            id='canto_network_selector'
            onClick={() => window.open('http://canto.io/lp', '_blank')}
            key='canto'
            custom={chains.length + 1}
            variants={ItemEnterAnimation}
            tabIndex={0}
        >
            <ChainNameStatus tabIndex={0} active={false}>
                <img
                    src={cantoLogo}
                    alt='canto network'
                    width='21px'
                    height='21px'
                    style={{ borderRadius: '50%' }}
                />
                <Text color='white' marginRight='10px'>
                    Canto
                </Text>
                <RiExternalLinkLine size={14} />
            </ChainNameStatus>
        </NetworkItem>
    );

    // JSX element to select goerli network
    const goerliNetwork: JSX.Element = (
        <NetworkItem
            id='goerli_network_selector'
            onClick={() => handleClick(chainMap.get('0x5'))}
            key='goerli'
            custom={0}
            variants={ItemEnterAnimation}
            tabIndex={0}
        >
            <ChainNameStatus tabIndex={0} active={chainId === '0x5'}>
                <img
                    src={ETH}
                    alt='goerli network'
                    width='21px'
                    height='21px'
                    style={{ borderRadius: '50%' }}
                />
                <Text color={chainId === '0x5' ? 'accent1' : 'white'}>
                    Görli
                </Text>
            </ChainNameStatus>
        </NetworkItem>
    );

    // JSX element to select sepolia network
    // uses the same logo as scroll network
    const sepoliaNetwork: JSX.Element = (
        <NetworkItem
            id='sepolia_network_selector'
            onClick={() => handleClick(chainMap.get('0x8274f'))}
            key='sepolia'
            custom={0}
            variants={ItemEnterAnimation}
            tabIndex={0}
        >
            <ChainNameStatus tabIndex={0} active={chainId === '0x8274f'}>
                <img
                    src={scrollLogo}
                    alt='scroll network'
                    width='21px'
                    height='21px'
                    style={{ borderRadius: '50%' }}
                />
                <Text color={chainId === '0x8274f' ? 'accent1' : 'white'}>
                    Sepolia
                </Text>
            </ChainNameStatus>
        </NetworkItem>
    );

    return (
        <div style={{ position: 'relative' }}>
            <DropdownMenuContainer
                justifyContent='center'
                alignItems='center'
                gap={4}
            >
                <DropdownMenu2
                    marginTop={'50px'}
                    titleWidth={'80px'}
                    title={'Blast'}
                    // title={lookupChain(chainId).displayName}
                    logo={
                        'https://deploy-preview-3380--ambient-finance.netlify.app/blast_logo.jpeg'
                    }
                >
                    <MenuContent
                        tabIndex={0}
                        aria-label={'Dropdown menu for networks.'}
                    >
                        {chainMap.has('0x1') && ethereumNetwork}
                        {chainMap.has('0x82750') && scrollNetwork}
                        {INCLUDE_CANTO_LINK && cantoNetwork}
                        {chainMap.has('0x5') && goerliNetwork}
                        {chainMap.has('0x8274f') && sepoliaNetwork}
                    </MenuContent>
                </DropdownMenu2>
            </DropdownMenuContainer>
        </div>
    );
}
