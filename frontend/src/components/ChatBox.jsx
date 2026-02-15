import PropTypes from 'prop-types';
import './ChatBox.css';

function ChatBox({ messages }) {
    return (
        <div className="chat-box">
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                    <div className="message-content">
                        <p>{message.text}</p>
                    </div>
                    <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            ))}
        </div>
    );
}

ChatBox.propTypes = {
    messages: PropTypes.arrayOf(
        PropTypes.shape({
            sender: PropTypes.string.isRequired,
            text: PropTypes.string.isRequired,
            timestamp: PropTypes.number.isRequired
        })
    ).isRequired
};

export default ChatBox;
