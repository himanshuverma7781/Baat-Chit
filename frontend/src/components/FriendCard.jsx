import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
import { MessageCircle } from "lucide-react";

const FriendCard = ({ friend }) => {
  const unreadCount = useUnreadMessages(friend._id);

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12 relative">
            <img src={friend.profilePic} alt={friend.fullName} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 badge badge-sm badge-error">{unreadCount}</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>
            {unreadCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-primary mt-1">
                <MessageCircle className="size-3" />
                <span className="font-medium">{unreadCount} new message{unreadCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>
        </div>

        <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full">
          Message
        </Link>
      </div>
    </div>
  );
};
export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}
