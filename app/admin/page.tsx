'use client'

import { useEffect, useState, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getCookie } from 'cookies-next'
import UploadButton from '@/components/UploadButton'

interface Media {
    id: string
    url: string
    type: string
}

interface Room {
    id: string
    name: string
    slug: string
    coverImage?: string | null
    media: Media[]
}

export default function AdminPage() {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [authError, setAuthError] = useState(false)
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Create room form
    const [newRoomName, setNewRoomName] = useState('')
    const [newRoomCover, setNewRoomCover] = useState('')
    const [createError, setCreateError] = useState('')

    // Edit room state
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editCover, setEditCover] = useState('')
    const [syncLogs, setSyncLogs] = useState<string[]>([])

    const [showSyncLogs, setShowSyncLogs] = useState(false)
    const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())

    // Add media state
    const [selectedRoomId, setSelectedRoomId] = useState('')
    const [mediaUrl, setMediaUrl] = useState('')
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image')

    useEffect(() => {
        const authCookie = getCookie('museum_auth')
        if (authCookie === 'authenticated') {
            setIsAuthenticated(true)
            fetchRooms()
        } else {
            setIsLoading(false)
        }
    }, [])

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/rooms')
            const data = await response.json()
            // Fetch media for each room
            const roomsWithMedia = await Promise.all(
                data.map(async (room: Room) => {
                    const roomResponse = await fetch(`/api/rooms/${room.slug}`)
                    return await roomResponse.json()
                })
            )
            setRooms(roomsWithMedia)
        } catch (error) {
            console.error('Error fetching rooms:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAuth = async (e: FormEvent) => {
        e.preventDefault()
        if (password === '220810') {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })
            if (response.ok) {
                setIsAuthenticated(true)
                setAuthError(false)
                fetchRooms()
            }
        } else {
            setAuthError(true)
            setPassword('')
        }
    }

    const handleCreateRoom = async (e: FormEvent) => {
        e.preventDefault()
        setCreateError('')

        try {
            const response = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newRoomName,
                    coverImage: newRoomCover || null,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                setCreateError(error.error || 'Failed to create room')
                return
            }

            setNewRoomName('')
            setNewRoomCover('')
            fetchRooms()
        } catch (error) {
            setCreateError('Failed to create room')
        }
    }

    const handleUpdateRoom = async (room: Room) => {
        try {
            await fetch(`/api/rooms/${room.slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    coverImage: editCover || null,
                }),
            })

            setEditingRoom(null)
            fetchRooms()
        } catch (error) {
            console.error('Error updating room:', error)
        }
    }

    const handleDeleteRoom = async (room: Room) => {
        if (!confirm('Are you sure you want to delete this room? All media will be deleted.')) {
            return
        }

        try {
            await fetch(`/api/rooms/${room.slug}`, {
                method: 'DELETE',
            })
            fetchRooms()
        } catch (error) {
            console.error('Error deleting room:', error)
        }
    }

    const handleAddMedia = async (e: FormEvent) => {
        e.preventDefault()

        try {
            await fetch('/api/media/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: selectedRoomId,
                    url: mediaUrl,
                    type: mediaType,
                }),
            })

            setMediaUrl('')
            setSelectedRoomId('')
            fetchRooms()
        } catch (error) {
            console.error('Error adding media:', error)
        }
    }

    const handleDeleteMedia = async (mediaId: string) => {
        if (!confirm('Are you sure you want to delete this media?')) {
            return
        }

        try {
            await fetch(`/api/media/${mediaId}`, {
                method: 'DELETE',
            })
            fetchRooms()
        } catch (error) {
            console.error('Error deleting media:', error)
        }
    }

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const res = await fetch('/api/admin/sync-media', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                setSyncLogs(data.logs || [])
                setShowSyncLogs(true)
                fetchRooms() // Refresh data
            } else {
                alert('Sync failed: ' + data.error)
            }
        } catch (error) {
            console.error(error)
            alert('Sync failed')
        } finally {
            setIsSyncing(false)
        }
    }

    const startEdit = (room: Room) => {
        setEditingRoom(room)
        setEditName(room.name)
        setEditCover(room.coverImage || '')
    }

    const toggleRoomExpansion = (roomId: string) => {
        setExpandedRooms(prev => {
            const next = new Set(prev)
            if (next.has(roomId)) {
                next.delete(roomId)
            } else {
                next.add(roomId)
            }
            return next
        })
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-museum-sky dark:bg-museum-dark transition-colors duration-500">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full px-6"
                >
                    <div className="flex justify-center mb-8">
                        <h1 className="modern-title-bar text-2xl md:text-3xl px-8 py-3">
                            Admin Access
                        </h1>
                    </div>
                    <form onSubmit={handleAuth} className="glass-effect rounded-2xl p-8">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-white/50 dark:bg-white/5 border ${authError ? 'border-red-500' : 'border-slate-300 dark:border-museum-rose/30'
                                } rounded-lg px-6 py-4 text-center text-2xl tracking-widest text-slate-800 dark:text-museum-cream focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose focus:ring-1 focus:ring-museum-sky-accent dark:focus:ring-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30`}
                            placeholder="••••••"
                            autoFocus
                        />
                        {authError && (
                            <p className="text-red-400 text-sm mt-3 text-center">
                                Incorrect password
                            </p>
                        )}
                        <button
                            type="submit"
                            className="w-full mt-6 bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold py-4 rounded-lg hover:opacity-90 transition-all shadow-lg"
                        >
                            Enter Admin
                        </button>
                    </form>
                </motion.div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-museum-sky dark:bg-museum-dark transition-colors duration-500">
                <div className="text-center">
                    <motion.div
                        className="w-16 h-16 mx-auto mb-4 border-4 border-museum-sky-accent/30 dark:border-museum-rose/30 border-t-museum-sky-accent dark:border-t-museum-rose rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-slate-600 dark:text-museum-rose/60">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-museum-sky dark:bg-museum-dark transition-colors duration-500">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-museum-rose/20 bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-serif text-slate-800 dark:text-museum-rose">Admin Panel</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="px-4 py-2 rounded-full border border-museum-sky-accent dark:border-museum-rose/50 text-museum-sky-accent dark:text-museum-rose hover:bg-museum-sky-accent/10 dark:hover:bg-museum-rose/10 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSyncing ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            )}
                            Sync Local Media
                        </button>
                        <button
                            onClick={() => router.push('/hallway')}
                            className="px-4 py-2 rounded-full border border-slate-300 dark:border-museum-rose/30 text-slate-600 dark:text-museum-cream hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        >
                            View Hallway
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-12">
                {/* Create Room Form */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-serif text-museum-sky-accent dark:text-museum-rose mb-6">Create New Room</h2>
                    <form onSubmit={handleCreateRoom} className="glass-effect rounded-2xl p-6">
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-slate-600 dark:text-museum-cream/70 text-sm mb-2">
                                    Room Name *
                                </label>
                                <input
                                    type="text"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-museum-rose/30 rounded-lg px-4 py-3 text-slate-800 dark:text-museum-cream focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30"
                                    placeholder="Our First Date"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 dark:text-museum-cream/70 text-sm mb-2">
                                    Cover Image URL
                                </label>
                                <input
                                    type="url"
                                    value={newRoomCover}
                                    onChange={(e) => setNewRoomCover(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-museum-rose/30 rounded-lg px-4 py-3 text-slate-800 dark:text-museum-cream focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        {createError && (
                            <p className="text-red-400 text-sm mb-4">{createError}</p>
                        )}
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-lg bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Create Room
                        </button>
                    </form>
                </motion.section>

                {/* Add Media Form */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-serif text-museum-sky-accent dark:text-museum-rose mb-6">Add Media to Room</h2>

                    {/* Upload File Section */}
                    <div className="glass-effect rounded-2xl p-6 mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-museum-cream mb-4">📤 Upload File</h3>
                        <div className="mb-4">
                            <label className="block text-slate-600 dark:text-museum-cream/70 text-sm mb-2">
                                Select Room *
                            </label>
                            <select
                                value={selectedRoomId}
                                onChange={(e) => setSelectedRoomId(e.target.value)}
                                className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-museum-rose/30 rounded-lg px-4 py-3 text-slate-800 dark:text-museum-cream focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose transition-all"
                            >
                                <option value="">Choose a room...</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedRoomId && (
                            <UploadButton
                                roomId={selectedRoomId}
                                onUploadComplete={fetchRooms}
                            />
                        )}
                    </div>

                    {/* Divider */}
                    <div className="relative py-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-museum-rose/20"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-museum-sky dark:bg-museum-dark px-4 text-sm text-slate-500 dark:text-museum-rose-muted">OR</span>
                        </div>
                    </div>
                    {/* Add by URL Section */}
                    <form onSubmit={handleAddMedia} className="glass-effect rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-museum-cream mb-4">🔗 Add by URL</h3>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-slate-600 dark:text-museum-cream/70 text-sm mb-2">
                                    Select Room *
                                </label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-museum-rose/30 focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose text-slate-800 dark:text-museum-cream"
                                    required
                                >
                                    <option value="">Choose a room...</option>
                                    {rooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-600 dark:text-museum-cream/70 text-sm mb-2">
                                    Media URL *
                                </label>
                                <input
                                    type="url"
                                    value={mediaUrl}
                                    onChange={(e) => setMediaUrl(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-museum-rose/30 rounded-lg px-4 py-3 text-slate-800 dark:text-museum-cream focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30"
                                    placeholder="https://..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 dark:text-museum-cream/70 text-sm mb-2">
                                    Type *
                                </label>
                                <select
                                    value={mediaType}
                                    onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                                    className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-museum-rose/30 rounded-lg px-4 py-3 text-slate-800 dark:text-museum-cream focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose transition-all"
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-lg bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Add Media
                        </button>
                    </form>
                </motion.section>

                {/* Existing Rooms */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-2xl font-serif text-museum-sky-accent dark:text-museum-rose mb-6">Manage Rooms</h2>
                    <div className="space-y-6">
                        {rooms.map((room) => (
                            <div key={room.id} className="glass-effect rounded-2xl p-6">
                                {editingRoom?.id === room.id ? (
                                    <div className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-800 dark:text-museum-cream/70 text-sm mb-2">
                                                    Room Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-museum-rose/30 rounded-lg px-4 py-3 text-slate-800 dark:text-museum-cream focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-800 dark:text-museum-cream/70 text-sm mb-2">
                                                    Cover Image URL
                                                </label>
                                                <input
                                                    type="url"
                                                    value={editCover}
                                                    onChange={(e) => setEditCover(e.target.value)}
                                                    className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-museum-rose/30 rounded-lg px-4 py-3 text-slate-800 dark:text-museum-cream focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateRoom(room)}
                                                className="px-4 py-2 rounded-lg bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold hover:opacity-90 transition-opacity"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingRoom(null)}
                                                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-museum-rose/30 text-slate-600 dark:text-museum-cream hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-serif text-slate-800 dark:text-museum-cream mb-1">
                                                    {room.name}
                                                </h3>
                                                <p className="text-slate-500 dark:text-museum-cream/50 text-sm">
                                                    /{room.slug} • {room.media.length} media items
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleRoomExpansion(room.id)}
                                                    className="px-3 py-1 rounded-lg border border-slate-300 dark:border-museum-rose/30 text-slate-600 dark:text-museum-cream hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-sm flex items-center gap-1"
                                                >
                                                    {expandedRooms.has(room.id) ? (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                            Hide
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Show ({room.media.length})
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => startEdit(room)}
                                                    className="px-3 py-1 rounded-lg border border-slate-300 dark:border-museum-rose/30 text-slate-600 dark:text-museum-cream hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRoom(room)}
                                                    className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Media items */}
                                        {room.media.length > 0 && expandedRooms.has(room.id) && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                                {room.media.map((media) => (
                                                    <div key={media.id} className="relative group">
                                                        <div className="aspect-square rounded-lg overflow-hidden bg-white/5">
                                                            {media.type === 'image' ? (
                                                                <img
                                                                    src={media.url}
                                                                    alt="Media"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <video
                                                                    src={media.url}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteMedia(media.id)}
                                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                                }
                            </div >
                        ))}
                    </div >
                </motion.section >
            </div >
            {/* Sync Logs Modal */}
            <AnimatePresence>
                {
                    showSyncLogs && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white dark:bg-museum-dark border border-slate-200 dark:border-museum-rose/20 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-200 dark:border-museum-rose/20 flex justify-between items-center">
                                    <h3 className="text-xl font-serif text-slate-800 dark:text-museum-rose">Sync Results</h3>
                                    <button
                                        onClick={() => setShowSyncLogs(false)}
                                        className="text-slate-500 hover:text-slate-700 dark:text-museum-cream/50 dark:hover:text-museum-cream"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-black/20 font-mono text-sm">
                                    {syncLogs.length > 0 ? (
                                        <div className="space-y-1">
                                            {syncLogs.map((log, i) => (
                                                <div key={i} className={`
                                                ${log.includes('⚠️') ? 'text-yellow-600 dark:text-yellow-400' : ''}
                                                ${log.includes('❌') ? 'text-red-600 dark:text-red-400' : ''}
                                                ${log.includes('✅') ? 'text-green-600 dark:text-green-400' : ''}
                                                ${log.includes('+ Added') ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                                                text-slate-700 dark:text-museum-cream/80
                                            `}>
                                                    {log}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-500 italic">No logs available.</p>
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-200 dark:border-museum-rose/20 flex justify-end">
                                    <button
                                        onClick={() => setShowSyncLogs(false)}
                                        className="px-6 py-2 rounded-lg bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div >
    )
}
