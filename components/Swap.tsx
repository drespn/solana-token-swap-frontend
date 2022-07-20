import {
    Box,
    Select,
    Button,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    StylesProvider,
} from "@chakra-ui/react"
import { FC, useState } from "react"
import * as Web3 from "@solana/web3.js"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
    kryptMint,
    ScroogeCoinMint,
    tokenSwapStateAccount,
    swapAuthority,
    poolKryptAccount,
    poolScroogeAccount,
    poolMint,
    feeAccount,
} from "../utils/constants"
import { TokenSwap, TOKEN_SWAP_PROGRAM_ID } from "@solana/spl-token-swap"
import * as token from "@solana/spl-token"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import styles from '../styles/Home.module.css'

export const SwapToken: FC = () => {
    const [amount, setAmount] = useState(0)
    const [mint, setMint] = useState("")
    const [txSig, setTxSig] = useState('')

    const { connection } = useConnection()
    const { publicKey, sendTransaction } = useWallet()
    const link = () => {
        return txSig ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet` : ''
    }

    const handleSwapSubmit = (event: any) => {
        event.preventDefault()
        handleTransactionSubmit()
    }

    const handleTransactionSubmit = async () => {
        if (!publicKey) {
            alert("Please connect your wallet!")
            return
        }

        //DERIVE: All appropriate addresses, tokens included for decimal precision
        const kryptoAta = await token.getAssociatedTokenAddress(kryptMint,publicKey)
        const scroogeAta = await token.getAssociatedTokenAddress(ScroogeCoinMint,publicKey)
        const poolAtaKey = await token.getAssociatedTokenAddress(poolMint,publicKey)

        //create account struct for appropriate addresses
        const mintAccount = await token.getMint(connection,poolMint)
        const kryptMintAccount = await token.getMint(connection,kryptMint)
        const scroogeMintAccount = await token.getMint(connection,ScroogeCoinMint)


        //check or create ata for LP
        const poolAta = await connection.getAccountInfo(poolAtaKey)

        const tx = new Web3.Transaction()

        if(poolAta == null){
            const createPoolAtaIx = token.createAssociatedTokenAccountInstruction(
                publicKey,
                poolAtaKey,
                publicKey,
                poolMint
            )
            tx.add(createPoolAtaIx)
        }


        if(mint == 'option1'){
            const ix = TokenSwap.swapInstruction(
                tokenSwapStateAccount,
                swapAuthority,
                publicKey,
                kryptoAta,
                poolKryptAccount,
                poolScroogeAccount,
                scroogeAta,
                poolMint,
                feeAccount,
                null,
                TOKEN_SWAP_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                amount * 10 ** kryptMintAccount.decimals,
                0
            )
            tx.add(ix)
        } else if(mint=='option2'){
            const ix = TokenSwap.swapInstruction(
                tokenSwapStateAccount,
                swapAuthority,
                publicKey,
                scroogeAta,
                poolScroogeAccount,
                poolKryptAccount,
                kryptoAta,
                poolMint,
                feeAccount,
                null,
                TOKEN_SWAP_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                amount * 10 ** scroogeMintAccount.decimals,
                0
            )
            tx.add(ix)
        }

        try {
            sendTransaction(tx,connection).then(sig=>{
                setTxSig(sig)
            })
            
        } catch (error) {
            alert(JSON.stringify(error))
        }
        
    }

    return (
        <Box
            p={4}
            display={{ md: "flex" }}
            maxWidth="32rem"
            margin={2}
            justifyContent="center"
        >
            <form onSubmit={handleSwapSubmit}>
                <FormControl isRequired>
                    <FormLabel color="gray.200">Swap Amount</FormLabel>
                    <NumberInput
                        max={1000}
                        min={1}
                        onChange={(valueString) =>
                            setAmount(parseInt(valueString))
                        }
                    >
                        <NumberInputField id="amount" color="gray.400" />
                    </NumberInput>
                    <div style={{ display: "flex" }}>
                        <Select
                            display={{ md: "flex" }}
                            justifyContent="center"
                            placeholder="Token to Swap"
                            color="white"
                            variant="outline"
                            dropShadow="#282c34"
                            onChange={(item) =>
                                setMint(item.currentTarget.value)
                            }
                        >
                            <option
                                style={{ color: "#282c34" }}
                                value="option1"
                            >
                                {" "}
                                Krypt{" "}
                            </option>
                            <option
                                style={{ color: "#282c34" }}
                                value="option2"
                            >
                                {" "}
                                Scrooge{" "}
                            </option>
                        </Select>
                    </div>
                </FormControl>
                <Button width="full" mt={4} type="submit">
                    Swap ⇅
                </Button>
            </form>
            {
                txSig ?
                    <div className={styles.form}>
                        <p>View your transaction on </p>
                        <a href={link()}>Solana Explorer</a>
                    </div> :
                    null
            }
        </Box>
    )
}
