var store = require('../../store');

var Cycle = require('./cycle.jsx');

var actions = require('../../actions');

var Component = React.createClass({
	getInitialState: store.getState,
	componentDidMount: function () {
		store.addChangeListener(this._onChange);
	},
	componentWillUnmount: function () {
		store.removeChangeListener(this._onChange);
	},
	render: function () {
		var cycles = [];
		var cy = this.state.preset.cycles;
		for (var i = 0; i < cy.length; i++) {
			if (cy.length % 2 === 0 || i < cy.length - 1) {
				cycles.push(<Cycle key={i} id={i} data={cy[i]} cols={2}/>);
			} else {
				cycles.push(<Cycle key={i} id={i} data={cy[i]} cols={1}/>);
			}
		}
		return (
			<div className="cycle-builder">
				<div className="jumbotron header">
					<div className="container">
						<h1>Cycle Builder</h1>
						<p>
							Create custom cycling keyboard actions.
						</p>
						<button onClick={actions.addCycle} type="button" className="btn btn-success"><i className="glyphicon glyphicon-plus"/> Cycle</button>
					</div>
				</div>
				<div className="container">
					<div className="row">
						<div className="col-sm-4">
							<div className="media">
								<div className="media-left media-middle">
									<i className="glyphicon glyphicon-question-sign" style={{fontSize: '4em'}}/>
								</div>
								<div className="media-body">
									<h4 className="media-heading">What Are Cycles?</h4>
									Cycles allow you to create advanced keybinds, that do something different every time they're pressed.
									When all actions are used once, the cycle gets reset and starts again.
								</div>
							</div>
						</div>
						<div className="col-sm-4">
							<div className="media">
								<div className="media-left media-middle">
									<i className="glyphicon glyphicon-arrow-down" style={{fontSize: '4em'}}/>
								</div>
								<div className="media-body">
									<h4 className="media-heading">Dunk Your Enemies</h4>
									Cycles with healthbar separators allow you to see that an enemy is below the Dunk threshold by looking at his HP bar.
									This trick for Axe-players is included in the default Manta preset.
								</div>
							</div>
						</div>
						<div className="col-sm-4">
							<div className="media">
								<div className="media-left media-middle">
									<i className="glyphicon glyphicon-queen" style={{fontSize: '4em'}}/>
								</div>
								<div className="media-body">
									<h4 className="media-heading">Other Use-Cases</h4>
									That HP trick works for every combo, especially for pure-damage skills like Sonic Wave.
									You can make cycles for everything Manta knows, even chatwheels or other cycles.
								</div>
							</div>
						</div>
					</div>
					<br/>
					<div className="row">
						{cycles}
					</div>
				</div>
			</div>
		);
	},
	_onChange: function () {
		this.setState(store.getState());
	}
});

module.exports = Component;
