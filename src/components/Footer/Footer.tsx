import { useMediaQuery } from '@mui/material';
import styles from './Footer.module.css';
import { BsGithub, BsTwitter, BsMedium } from 'react-icons/bs';
import { FaDiscord } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import {
    CORPORATE_LINK,
    DISCORD_LINK,
    DOCS_LINK,
    GITHUB_LINK,
    MEDIUM_LINK,
    TWITTER_LINK,
} from '../../constants';
import { useTermsAgreed } from '../../App/hooks/useTermsAgreed';
import { GiAlligatorClip } from 'react-icons/gi';
import FooterItem from './FooterItem';

export interface footerItemIF {
    title: JSX.Element;
    content: string;
    link: string;
}

export default function Footer() {
    const [, , termsUrls] = useTermsAgreed();

    const footerData: footerItemIF[] = [
        {
            title: <>Terms of Service</>,
            content: 'Our rules for using the platform',
            link: `${window.location.origin}/${termsUrls.tos}`,
        },
        {
            title: <>Privacy Policy</>,
            content: 'View our policies around data',
            link: `${window.location.origin}/${termsUrls.privacy}`,
        },
        {
            title: <>Docs</>,
            content: 'View our documentation',
            link: DOCS_LINK,
        },
        {
            title: (
                <>
                    <BsGithub size={15} /> GitHub
                </>
            ),
            content: 'View our smart contracts, SDK, and more',
            link: GITHUB_LINK,
        },
        {
            title: (
                <>
                    <GiAlligatorClip size={15} /> About Us
                </>
            ),
            content: 'Learn more about parent company Crocodile Labs',
            link: CORPORATE_LINK,
        },
        {
            title: (
                <>
                    <BsTwitter size={15} /> Twitter
                </>
            ),
            content: 'Keep up with the latest on twitter',
            link: TWITTER_LINK,
        },
        {
            title: (
                <>
                    <FaDiscord size={15} /> Discord
                </>
            ),
            content: 'Join the community ',
            link: DISCORD_LINK,
        },
        {
            title: (
                <>
                    <BsMedium size={15} /> Medium
                </>
            ),
            content: 'Read the latest from our team on Medium',
            link: MEDIUM_LINK,
        },
    ];

    const itemsPerColumn: [number, number, number] = [2, 3, 5];

    const columnizedData = itemsPerColumn.map((count: number, idx: number) => {
        const subArray: number[] = itemsPerColumn.slice(0, idx + 1);

        const sliceStart = subArray
            .slice(0, subArray.length - 1)
            .reduce(
                (accumulator, currentValue) => accumulator + currentValue,
                0,
            );
        const sliceEnd = subArray.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
        );

        return footerData.slice(sliceStart, sliceEnd);
    });

    console.log(columnizedData);

    const mobileButton = (
        <Link
            to={'/trade'}
            tabIndex={0}
            aria-label='Go to trade page button'
            className={styles.started_button}
        >
            Trade Now
        </Link>
    );

    const showMobileVersion = useMediaQuery('(max-width: 600px)');

    const mobileItems = (
        <div className={styles.mobile_version}>
            {footerData.map((data) => (
                <FooterItem
                    title={data.title}
                    content={data.content}
                    link={data.link}
                    key={data.content}
                />
            ))}
            {mobileButton}
        </div>
    );
    if (showMobileVersion)
        return <div className={styles.mobile_bg}>{mobileItems}</div>;
    return (
        <section className={styles.container}>
            <div className={styles.content}>
                {columnizedData.map((elements: footerItemIF[], idx: number) => (
                    <div className={styles.row} key={idx}>
                        {elements.map((element: footerItemIF) => (
                            <FooterItem
                                title={element.title}
                                content={element.content}
                                link={element.link}
                                key={element.link}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
}
