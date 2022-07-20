import { FC } from "react"
import styles from "../styles/Home.module.css"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import Image from "next/image"

export const AppBar: FC = () => {
    return (
        <div className={styles.AppHeader}>
            
            <header>LP DeFi Protocol Version 0.1.0</header>
            <WalletMultiButton />
        </div>

    )
}
