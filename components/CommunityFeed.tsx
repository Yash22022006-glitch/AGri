
import React, { useState, useRef } from 'react';

interface Comment {
    id: number;
    author: string;
    text: string;
    time: string;
}

interface Post {
    id: number;
    author: string;
    text: string;
    type: 'text' | 'image' | 'audio';
    content?: string;
    time: string;
    likes: number;
    isLiked: boolean;
    comments: Comment[];
}

const CommunityFeed: React.FC<{ location: string }> = ({ location }) => {
    const [posts, setPosts] = useState<Post[]>([
        {
            id: 1,
            author: 'Ramesh K.',
            text: 'Look at my rice harvest this season! The organic manure really helped.',
            type: 'image',
            content: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
            time: '2h ago',
            likes: 24,
            isLiked: false,
            comments: [
                { id: 101, author: 'Sita M.', text: 'Amazing yield! Which brand of manure?', time: '1h ago' }
            ]
        },
        {
            id: 2,
            author: 'Suresh V.',
            text: 'Any advice on the sudden pest attack on tomato plants?',
            type: 'text',
            time: '5h ago',
            likes: 8,
            isLiked: true,
            comments: []
        },
        {
            id: 3,
            author: 'Meena P.',
            text: 'Shared an audio recording of the local expert meeting.',
            type: 'audio',
            content: 'Recording_102.mp3',
            time: 'Yesterday',
            likes: 15,
            isLiked: false,
            comments: []
        }
    ]);

    const [input, setInput] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
    const [commentInput, setCommentInput] = useState('');
    const [shareFeedback, setShareFeedback] = useState<number | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setIsCameraActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert("Please allow camera access to share photos with the community.");
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');

                const newPost: Post = {
                    id: Date.now(),
                    author: 'You',
                    text: input || 'Just captured this in the field.',
                    type: 'image',
                    content: dataUrl,
                    time: 'Just now',
                    likes: 0,
                    isLiked: false,
                    comments: []
                };
                setPosts([newPost, ...posts]);
                setInput('');
                closeCamera();
            }
        }
    };

    const closeCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };

    const handlePost = () => {
        if (!input) return;
        const newPost: Post = {
            id: Date.now(),
            author: 'You',
            text: input,
            type: 'text',
            time: 'Just now',
            likes: 0,
            isLiked: false,
            comments: []
        };
        setPosts([newPost, ...posts]);
        setInput('');
    };

    const toggleLike = (postId: number) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    isLiked: !post.isLiked,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1
                };
            }
            return post;
        }));
    };

    const handleAddComment = (postId: number) => {
        if (!commentInput.trim()) return;
        const newComment: Comment = {
            id: Date.now(),
            author: 'You',
            text: commentInput,
            time: 'Just now'
        };
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: [...post.comments, newComment]
                };
            }
            return post;
        }));
        setCommentInput('');
        setActiveCommentId(null);
    };

    const handleShare = (postId: number) => {
        if (navigator.share) {
            navigator.share({
                title: 'AgriFlow Community Post',
                text: 'Check out this post on AgriFlow!',
                url: window.location.href,
            }).catch(console.error);
        } else {
            setShareFeedback(postId);
            setTimeout(() => setShareFeedback(null), 2000);
        }
    };

    return (
        <div className="p-4 space-y-4 pb-20">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-sm">
                <h2 className="text-emerald-800 font-bold mb-1">Local Farmers Community</h2>
                <p className="text-emerald-600 text-sm">Showing farmers active in {location}</p>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-100">
                {isCameraActive ? (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video mb-3 animate-in fade-in duration-300">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <button onClick={closeCamera} className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-all">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                            <button onClick={takePhoto} className="bg-emerald-500 text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 transform active:scale-95 transition-all">
                                <i className="fa-solid fa-camera text-xl"></i>
                            </button>
                        </div>
                    </div>
                ) : (
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="What's happening in your field?"
                        className="w-full p-3 bg-stone-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] outline-none text-stone-800"
                    />
                )}
                <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-4 text-stone-500 ml-2">
                        {!isCameraActive && (
                            <>
                                <button onClick={startCamera} className="hover:text-emerald-600 transition-colors">
                                    <i className="fa-solid fa-camera"></i>
                                </button>
                                <button className="hover:text-emerald-600 transition-colors">
                                    <i className="fa-solid fa-microphone"></i>
                                </button>
                                <button className="hover:text-emerald-600 transition-colors">
                                    <i className="fa-solid fa-video"></i>
                                </button>
                            </>
                        )}
                    </div>
                    <button
                        onClick={handlePost}
                        disabled={!input && !isCameraActive}
                        className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-30"
                    >
                        Post
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-stone-100 transition-transform hover:translate-y-[-2px]">
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                                    {post.author[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{post.author}</p>
                                    <p className="text-[10px] text-stone-400">{post.time}</p>
                                </div>
                            </div>
                            <p className="text-sm text-stone-700 mb-3">{post.text}</p>
                            {post.type === 'image' && post.content && (
                                <img src={post.content} alt="Post content" className="w-full h-auto rounded-lg shadow-inner bg-stone-50" />
                            )}
                            {post.type === 'audio' && (
                                <div className="bg-stone-50 p-3 rounded-lg flex items-center gap-3 border border-stone-100">
                                    <i className="fa-solid fa-play text-emerald-600"></i>
                                    <div className="flex-1 h-1 bg-stone-200 rounded-full relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-emerald-500 rounded-full"></div>
                                    </div>
                                    <span className="text-[10px] text-stone-500">2:45</span>
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-3 border-t border-stone-50 flex gap-6 text-stone-500 text-[10px] font-bold uppercase tracking-wider items-center">
                            <button
                                onClick={() => toggleLike(post.id)}
                                className={`flex items-center gap-1.5 transition-colors ${post.isLiked ? 'text-emerald-600' : 'hover:text-emerald-600'}`}
                            >
                                <i className={`${post.isLiked ? 'fa-solid' : 'fa-regular'} fa-thumbs-up`}></i>
                                {post.likes > 0 ? `${post.likes} Likes` : 'Like'}
                            </button>
                            <button
                                onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)}
                                className={`flex items-center gap-1.5 transition-colors ${activeCommentId === post.id ? 'text-emerald-600' : 'hover:text-emerald-600'}`}
                            >
                                <i className="fa-regular fa-comment"></i>
                                {post.comments.length > 0 ? `${post.comments.length} Comments` : 'Comment'}
                            </button>
                            <button
                                onClick={() => handleShare(post.id)}
                                className="hover:text-emerald-600 flex items-center gap-1.5 relative"
                            >
                                <i className="fa-solid fa-share"></i>
                                Share
                                {shareFeedback === post.id && (
                                    <span className="absolute -top-8 left-0 bg-stone-800 text-white px-2 py-1 rounded text-[8px] whitespace-nowrap animate-bounce">
                                        Link Copied!
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Comment Section */}
                        {(activeCommentId === post.id || activeCommentId === post.id) && (
                            <div className="bg-stone-50/50 p-4 border-t border-stone-50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                {post.comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2">
                                        <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500 shrink-0">
                                            {comment.author[0]}
                                        </div>
                                        <div className="bg-white p-2 rounded-lg shadow-sm flex-1 border border-stone-100">
                                            <div className="flex justify-between items-baseline">
                                                <p className="text-[10px] font-bold text-stone-800">{comment.author}</p>
                                                <p className="text-[8px] text-stone-300">{comment.time}</p>
                                            </div>
                                            <p className="text-[11px] text-stone-600 mt-0.5">{comment.text}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex gap-2 items-center pt-1">
                                    <input
                                        type="text"
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="flex-1 bg-white border border-stone-200 rounded-full px-3 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                    />
                                    <button
                                        onClick={() => handleAddComment(post.id)}
                                        className="bg-emerald-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-700 transition-colors"
                                    >
                                        <i className="fa-solid fa-paper-plane text-[10px]"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommunityFeed;
