import React, {Component} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import './App.css';
import RealtimeClient from './RealtimeClient';
import Guid from 'guid';
import {
	Grid,
	Row,
	Col,
	Form,
	FormControl,
	Button,
	ListGroup,
	ListGroupItem,
	Nav,
	Navbar,
	NavItem,
	InputGroup,
	Modal
} from 'react-bootstrap';

const getClientId = () => `web-client:${Guid.raw()}`;
const getMessageId = () => `message-id:${Guid.raw()}`;

const User = (user) => (<ListGroupItem key={user.clientId}>{user.username}</ListGroupItem>);

const Users = ({users}) => (
	<div id="sidebar-wrapper">
		<div id="sidebar">
			<ListGroup>
				<ListGroupItem key="title">
					<i>Connected Users</i>
				</ListGroupItem>
				{users.map(User)}
			</ListGroup>
		</div>
	</div>
);

const Message = (msg) => (<ListGroupItem key={msg.id}><b>{msg.username}</b>: {msg.msg}</ListGroupItem>);

const ChatMessages = ({messages}) => (
	<div id="messages">
		<ListGroup>
			<ListGroupItem key="title">
				<i>Messages</i>
			</ListGroupItem>
			{messages.map(Message)}
		</ListGroup>
	</div>
);

const ChatHeader = ({isConnected}) => (
	<Navbar fixedTop>
		<Navbar.Header>
			<Navbar.Brand>
				Serverless IoT Chat Demo
			</Navbar.Brand>
		</Navbar.Header>
		<Nav>
			<NavItem>{(isConnected) ? 'Connected' : 'Disconnected'}</NavItem>
		</Nav>
	</Navbar>
);

class ChatInput extends Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
  }

	onSubmit(event) {
		this.props.onSend(this.input.value);
		this.input.value = '';
		event.preventDefault();
	}

	render() {
    return (
      <Navbar fixedBottom fluid>
        <Col xs={9} xsOffset={3}>
          <Form inline onSubmit={this.onSubmit}>
            <InputGroup>
              <FormControl
                type="text"
                placeholder="type a message..."
                inputRef={ref => {this.input = ref; }}/>
              <InputGroup.Button>
                <Button type="submit">Send</Button>
              </InputGroup.Button>
            </InputGroup>
          </Form>
        </Col>
      </Navbar>
    );
  }
};

const ChatWindow = ({users, messages, onSend}) => {
  console.log(users, messages, onSend);
  return (
    <div>
      <Grid fluid>
        <Row>
          <Col xs={3}>
            <Users users={users}/>
          </Col>
          <Col xs={9}>
            <ChatMessages messages={messages}/>
          </Col>
        </Row>
      </Grid>
      <ChatInput onSend={onSend}/>
    </div>
  );
};

class UserNamePrompt extends Component {
	constructor(props) {
		super(props);
		this.state = {showModal: true};
		this.onSubmit = this.onSubmit.bind(this);
	}
	onSubmit(event) {
		event.preventDefault();
		console.log('submit username', event);
		if (this.input.value) {
			this.props.onPickUsername(this.input.value);
			this.setState({showModal: false});
		}
	}
	render() {
		return (
			<Modal show={this.state.showModal} bsSize="sm">
				<Form inline onSubmit={this.onSubmit.bind(this)}>
					<Modal.Header closeButton>
						<Modal.Title>Pick your username</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<FormControl
							type="text"
							placeholder="type your username..."
							inputRef={ref => { this.input = ref; }}/>
					</Modal.Body>
					<Modal.Footer>
						<Button type="submit">Ok</Button>
					</Modal.Footer>
				</Form>
			</Modal>
		);
	}
}

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			users: [],
			messages: [],
			clientId: getClientId(),
			isConnected: false
		};
		this.connect = this.connect.bind(this);
	}

	connect(username) {
		this.setState({username});
		this.client = new RealtimeClient(this.state.clientId, username);
		console.log('ohai', this.state);
		this.client.connect()
			.then(() => {
		  console.log('connection complete');
				this.setState({isConnected: true});
				this.client.onMessageReceived((topic, message) => {
				  console.log('topic', topic);
					switch (topic) {
						case 'client-connected':
						  console.log('ohai');
							this.setState({ users: [...this.state.users, message] });
							break;
						case 'client-disconnected':
							this.setState({users: this.state.users.filter(user => user.clientId !== message.clientId)});
							break;
						default:
							this.setState({messages: [...this.state.messages, message]});
							break;
					}
				});
			});
	}

	onSend(message) {
		this.client.sendMessage({
			username: this.state.username,
			message: message,
			id: getMessageId()
		});
	}

	render() {
		const {isConnected, users, messages} = this.state;
		return (
			<div>
				<ChatHeader isConnected={isConnected}/>
				<ChatWindow
					users={users}
					messages={messages}
					onSend={this.onSend}/>
				<UserNamePrompt onPickUsername={this.connect}/>
			</div>
		);
	}
}

export default App;
