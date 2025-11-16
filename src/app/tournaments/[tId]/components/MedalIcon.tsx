interface MedalIconProps {
    place: number
}

export default function MedalIcon({ place }: MedalIconProps) {
    if (place === 1) {
        return <span className="text-yellow-500 text-lg">🥇</span>
    } else if (place === 2) {
        return <span className="text-gray-400 text-lg">🥈</span>
    } else if (place === 3) {
        return <span className="text-amber-600 text-lg">🥉</span>
    }
    return null
}

