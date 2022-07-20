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
    feeAccount,
} from "../utils/constants"
import { TokenSwap, TOKEN_SWAP_PROGRAM_ID } from "@solana/spl-token-swap"
import * as token from "@solana/spl-token"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"

export const WithdrawSingleTokenType: FC = (props: {
    onInputChange?: (val: number) => void
    onMintChange?: (account: string) => void
}) => {
    const [poolTokenAmount, setAmount] = useState(0)
    const { connection } = useConnection()
    const { publicKey, sendTransaction } = useWallet()

    const handleWithdrawSubmit = (event: any) => {
        event.preventDefault()
        handleTransactionSubmit()
    }

    const handleTransactionSubmit = async () => {
        if (!publicKey) {
            alert("Please connect your wallet!")
            return
        }

        //derive appropriate addresses
        const kryptAta = await token.getAssociatedTokenAddress(kryptMint,publicKey)
        const scroogeAta = await token.getAssociatedTokenAddress(ScroogeCoinMint,publicKey)
        const tokenAccountLP = await token.getAssociatedTokenAddress(poolMint,publicKey)

        //retrieve pool account info(or create it)
        const poolMintAccount = await token.getMint(connection,poolMint)

        const tx = new Web3.Transaction()

        //account for pool
        const accountInfoLP = await connection.getAccountInfo(tokenAccountLP)

        //CHECK: if account is created or not
        if(accountInfoLP == null){
            const createLPataIx = token.createAssociatedTokenAccountInstruction(
                publicKey,
                tokenAccountLP,
                publicKey,
                poolMint
            )
            tx.add(createLPataIx)
        }

        //create instruction for dual widthdrawal
        const widthdrawalIx = TokenSwap.withdrawAllTokenTypesInstruction(
            tokenSwapStateAccount,
            swapAuthority,
            publicKey,
            poolMint,
            feeAccount,
            tokenAccountLP,
            poolKryptAccount,
            poolScroogeAccount,
            kryptAta,
            scroogeAta,
            TOKEN_SWAP_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            poolTokenAmount * 10 ** poolMintAccount.decimals,
            0,
            0
        )

        tx.add(widthdrawalIx)
        
        try {
            const txid = await sendTransaction(tx,connection)
            alert(
                `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`
            )
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
            <form onSubmit={handleWithdrawSubmit}>
                <FormControl isRequired>
                    <FormLabel color="gray.200">
                        LP-Token Withdrawal Amount
                    </FormLabel>
                    <NumberInput
                        max={1000}
                        min={1}
                        onChange={(valueString) =>
                            setAmount(parseInt(valueString))
                        }
                    >
                        <NumberInputField id="amount" color="gray.400" />
                    </NumberInput>
                </FormControl>
                <Button width="full" mt={4} type="submit">
                    Withdraw
                </Button>
            </form>
        </Box>
    )
}
