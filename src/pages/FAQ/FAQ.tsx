import styles from '../TermsOfService/TermsOfService.module.css';

export default function PrivacyPolicy() {
    interface questionIF {
        question: string;
        answer: string;
    }
    const questions: questionIF[] = [
        {
            question: 'How do I earn Ambient Points?',
            answer: 'Ambient Points are earned by making swaps and providing liquidity. The more you swap and the more swaps use the liquidity you have provided, the more Points you earn. Points are distributed once per week.',
        },
        {
            question: 'How is Blast Gold distribution determined?',
            answer: 'Gold distribution is based on (rough order of descending importance) market depth of liquidity positions, TVL of in-range liquidity positions, swap volume, and small non-linear rewards for trying different actions. The relative weight of these components may change from distribution to distribution, but the overall approach will remain the same.',
        },
        {
            question:
                'What is the difference between Ambient Points and Blast Points?',
            answer: 'If youre in pools on Blast you\'ll earn Ambient Points, Blast Points (which are based on TVL) and Blast Gold. Be aware that Blast Points are distributed directly based on the criteria they provide us (TVL) and Blast Gold optimized for metrics that they want to see from an ecosystem perspective. The criteria for Gold will not be exactly the same as criteria for Ambient Points, because our goal is to align with Blast\'s objectives so they keep sending Ambient large amounts of Gold and ultimately Ambient users earn more Points. Blast Gold will be heavily based on 2% market depth, so keep orders tight and in-range. Obviously users on Scroll or Ethereum will not get Blast rewards, but we are hearing things about Scroll incentives coming soon.',
        },
        {
            question: 'Why is Gold distributed like this?',
            answer: 'It\'s important to understand that Blast Gold are not rewards that are arbitrarily determined by Ambient. These rewards come from the Blast ecosystem, and our ability to continue distributing high amounts of Gold rewards to users depends on how much we align with the Blast ecosystem objectives. As part of that we communicate with the Blast team to understand what their objectives are, and this in turn influences how we distribute Gold rewards.',
        },
        {
            question: 'When was the snapshot taken?',
            answer: 'The snapshot for the first Gold distribution was taken shortly after Blast announced the Gold distribution. This was on the afternoon of Friday March 22. Liquidity provided after this snapshot will still receive Gold, but will be based on the next Blast Gold distribution. We anticipate this to be released in 2-3 weeks. In general we will follow this policy of distributing each Gold drop based on the retroactive activity since the previous Gold release.',
        },
        {
            question: 'I got X Gold, is that good or bad?',
            answer: 'With the caveat that no one will know how much Blast rewards are worth until the airdrop, keep in mind that Gold and Points will in total make up 50% of the total airdrop respectively and so far are on the order of 1000× more Blast Points than Blast Gold.',
        },
        {
            question:
                'What does market depth mean and how can I optimize for it?',
            answer: 'Market depth means the amount of liquidity your LP position is providing within +/- 2% of the current pool price. For the same size LP position, the tighter the range the more market depth. A 10% wide range order provides approximately 10X more depth per dollar of capital. That being said when your order goes out of range it is no longer providing any market depth, and therefore is not accumulating rewards. So the best tradeoff is based on market volatility and how frequently you can manage the position. We will likely soon be putting market depth information directly into the app to help users make better decisions.',
        },
        {
            question: 'How is Gold distributed between pools?',
            answer: 'The relative distribution of Gold between pools is based on a set of metrics to normalize relative pool size (combination of volume, TVL, liquidity, and some measures to prevent manipulation of these metrics). That being said we may boost certain pools to help bootstrap liquidity as we did with YES/ETH and ORBIT/ETH in the initial distribution. Those pools ended up receiving about 5× more rewards.             While there are currently no announced Gold boosts, you can in general expect Gold rewards in alt pools to be higher to the extent that our altcoin liquidity is weak relative to ETH/USDB. For example, most alt pools ended up receiving 5-10× boosted rewards in the first epoch, even those outside the announced boosting.',
        },
    ];

    return (
        <div className={styles.background}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <span className={styles.header}>
                        Frequently Asked Questions
                    </span>
                    Last Updated: Apr 3, 2024
                    {questions.map((q: questionIF) => (
                        <>
                            <p className={styles.sub_header}>{q.question}</p>
                            <p>{q.answer}</p>
                        </>
                    ))}
                </div>
            </div>
        </div>
    );
}
