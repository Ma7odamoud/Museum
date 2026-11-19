'use client'

import { useState, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function GatekeeperPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [isUnlocking, setIsUnlocking] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setErrorMsg('')
        setIsUnlocking(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
                const data = await res.json()
                setErrorMsg(data.error || 'Wrong password. Try again.')
                setIsUnlocking(false)
                return
            }

            // Give the browser a moment to store the cookie, then navigate
            setTimeout(() => {
                router.push('/hallway')
            }, 800)
        } catch {
            setErrorMsg('Something went wrong. Please try again.')
            setIsUnlocking(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-museum-sky dark:bg-gradient-to-br dark:from-museum-darker dark:via-museum-dark dark:to-museum-darker transition-colors duration-500">
                <div className="absolute inset-0 opacity-10 dark:opacity-20">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-museum-rose rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                opacity: [0.2, 0.8, 0.2],
                                scale: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Main content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center px-6"
            >
                <AnimatePresence mode="wait">
                    {!isUnlocking ? (
                        <motion.div
                            key="gatekeeper"
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Title */}
                            <motion.h1
                                className="text-5xl md:text-7xl font-serif mb-4 modern-title-bar px-8 py-2"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1 }}
                            >
                                Memory Rooms
                            </motion.h1>

                            <motion.p
                                className="text-xl md:text-2xl text-slate-600 dark:text-museum-cream/80 max-w-2xl mx-auto font-light leading-relaxed mb-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                            >
                                A Virtual Memory Museum
                            </motion.p>

                            {/* Login form */}
                            <motion.form
                                onSubmit={handleSubmit}
                                className="max-w-md mx-auto"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                            >
                                <div className="glass-effect rounded-2xl p-8 museum-shadow flex flex-col gap-4">
                                    <h2 className="text-museum-rose text-lg font-medium tracking-wider uppercase mb-2">
                                        Authorized Access Only
                                    </h2>

                                    <div>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value)
                                                setErrorMsg('')
                                            }}
                                            className={`w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-white/5 border ${errorMsg ? 'border-red-500' : 'border-slate-300 dark:border-museum-rose/30'
                                                } text-center text-lg focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose focus:ring-1 focus:ring-museum-sky-accent dark:focus:ring-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30 text-slate-800 dark:text-white`}
                                            placeholder="Email address"
                                            autoFocus
                                            required
                                        />
                                    </div>

                                    <div>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value)
                                                setErrorMsg('')
                                            }}
                                            className={`w-full px-6 py-4 rounded-xl bg-white/50 dark:bg-white/5 border ${errorMsg ? 'border-red-500' : 'border-slate-300 dark:border-museum-rose/30'
                                                } text-center text-lg tracking-widest focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose focus:ring-1 focus:ring-museum-sky-accent dark:focus:ring-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30 text-slate-800 dark:text-white`}
                                            placeholder="Password"
                                            required
                                        />
                                    </div>

                                    {errorMsg && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-sm mt-1"
                                        >
                                            {errorMsg}
                                        </motion.p>
                                    )}

                                    <motion.button
                                        type="submit"
                                        className="px-8 py-4 rounded-xl bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-museum-sky-accent/20 dark:hover:shadow-museum-rose/20 w-full mt-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isUnlocking}
                                    >
                                        {isUnlocking ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                        ) : (
                                            'Unlock Museum'
                                        )}
                                    </motion.button>
                                </div>
                            </motion.form>

                            {/* Decorative elements */}
                            <motion.div
                                className="mt-16 flex justify-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 1 }}
                            >
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-museum-rose/40"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.4, 0.8, 0.4],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.3,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="unlocking"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 border-4 border-museum-sky-accent/30 dark:border-museum-rose/30 border-t-museum-sky-accent dark:border-t-museum-rose rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <h2 className="text-3xl font-serif text-museum-sky-accent dark:text-museum-rose">
                                Unlocking...
                            </h2>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
