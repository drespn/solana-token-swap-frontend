import {
    Box,
    Button,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
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
} from "../utils/constants"
import { TokenSwap, TOKEN_SWAP_PROGRAM_ID } from "@solana/spl-token-swap"
import * as token from "@solana/spl-token"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"

export const DepositSingleTokenType: FC = (props: {
    onInputChange?: (val: number) => void
    onMintChange?: (account: string) => void
}) => {
    const [poolTokenAmount, setAmount] = useState(0)

    const { connection } = useConnection()
    const { publicKey, sendTransaction } = useWallet()

    const handleSubmit = (event: any) => {
        event.preventDefault()
        handleTransactionSubmit()
    }

    const handleTransactionSubmit = async () => {
        //check for walley connection
        if (!publicKey) {
            alert("Please connect your wallet!")
            return
        }

        //fetch all token accounts for both tokens
        const kryptAta = await token.getAssociatedTokenAddress(kryptMint,publicKey)
        const scroogeAta = await token.getAssociatedTokenAddress(ScroogeCoinMint,publicKey)
        const tokenAccountLP = await token.getAssociatedTokenAddress(poolMint,publicKey)

        const poolinfo = await token.getMint(connection,poolMint)

        //CHECK: that LP token account exists
        const tx = new Web3.Transaction()

        //getting full account info for LP ata
        const accountInfoLP = await connection.getAccountInfo(tokenAccountLP)

        //CHECK: that LP token ata exists, as the publickey does, but may not have account
        if(accountInfoLP == null){
            //create the ata for LP
            const createLPataIx = token.createAssociatedTokenAccountInstruction(
                publicKey,
                tokenAccountLP,
                publicKey,
                poolMint 
            )
            tx.add(createLPataIx)
        }
        //create the instruction from API
        const depositBothIx = TokenSwap.depositAllTokenTypesInstruction(
            tokenSwapStateAccount, 
            swapAuthority,
            publicKey,
            kryptAta,
            scroogeAta,
            poolKryptAccount,
            poolScroogeAccount,
            poolMint,
            tokenAccountLP,
            TOKEN_SWAP_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            poolTokenAmount * 10 ** poolinfo.decimals,
            100e9,
            100e9
        )

        tx.add(depositBothIx)

        try {
           const txid = await sendTransaction(tx,connection)
           alert(`Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`)
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
            <form onSubmit={handleSubmit}>
                <div style={{ padding: "0px 10px 5px 7px" }}>
                    <FormControl isRequired>
                        <FormLabel color="gray.200">
                            LP-Tokens to receive for deposit to Liquidity Pool
                        </FormLabel>
                        <NumberInput
                            onChange={(valueString) =>
                                setAmount(parseInt(valueString))
                            }
                            style={{
                                fontSize: 20,
                            }}
                            placeholder="0.00"
                        >
                            <NumberInputField id="amount" color="gray.400" />
                        </NumberInput>
                        <Button width="full" mt={4} type="submit">
                            Deposit
                        </Button>
                    </FormControl>
                </div>
            </form>
        </Box>
    )
}
