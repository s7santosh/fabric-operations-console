/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/
import { CodeSnippet, SkeletonPlaceholder } from 'carbon-components-react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withLocalize } from 'react-localize-redux';
import { connect } from 'react-redux';
import { clearNotifications, showError, updateState } from '../../redux/commonActions';
import { ChannelParticipationApi } from '../../rest/ChannelParticipationApi';
import IdentityApi from '../../rest/IdentityApi';
import Helper from '../../utils/helper';
import Form from '../Form/Form';
import SidePanel from '../SidePanel/SidePanel';
import Clipboard from '../../utils/clipboard';


const SCOPE = 'ChannelParticipationDetails';

class ChannelParticipationUnjoinModal extends Component {

	componentDidMount() {
		if (this.props.channelInfo.nodes !== undefined) {
			let nodesArray = Object.values(this.props.channelInfo.nodes);
			this.props.updateState(SCOPE, {
				myNodeList: nodesArray,
				error: '',
				nodeNotSelected: false,
				noConfirmMatch: true
			});
		}
	}

	onUnjoin = async() => {
		try {
			this.props.myNodeList.map(async osn => {
				let all_identities = await IdentityApi.getIdentities();
				let unjoinResp = await ChannelParticipationApi.unjoinChannel(all_identities, osn, this.props.channelInfo.name);
				// TODO: consolidate error handling
				// cannot remove: system channel exists
				// cannot remove: channel does not exist
				if (_.get(unjoinResp, 'error') !== undefined) {
					this.props.updateState(SCOPE, { error: unjoinResp.error });
				} else {
					this.props.onComplete();
					this.props.onClose();
				}
			});
		} catch (e) {
			//error
			console.log('unable to unjoin', e);
		}
	}

	onChannelChange = (change, valid) => {
		this.props.updateState(SCOPE, {
			myNodeList: change.nodeList,
			nodeNotSelected: change.nodeList.length === 0
		});
	};

	renderUnjoin = (translate) => {
		let nodesArray = [];
		if (this.props.channelInfo.nodes !== undefined)
			nodesArray = Object.values(this.props.channelInfo.nodes);

		return (
			<div className="ibp-ca-no-identity">
				{this.props.loading ? (
					<SkeletonPlaceholder
						style={{
							cursor: 'pointer',
							height: '2rem',
							width: '10rem',
						}}
					/>
				) : (
					<div>
						<div className="ibp-modal-title">
							<h1 className="ibm-light">{this.props.channelInfo.name}</h1>
							<div className="ibp-remove-orderer-confirm">
								{translate('remove_orderer_channel_desc', {
									name: (
										<CodeSnippet
											type="inline"
											ariaLabel={translate('copy_text', { copyText: this.props.channelInfo.name })}
											light={false}
											onClick={() => Clipboard.copyToClipboard(this.props.channelInfo.name)}
										>
											{this.props.channelInfo.name}
										</CodeSnippet>
									),
								})}
							</div>
							<Form
								scope={SCOPE}
								id={SCOPE + '-channel'}
								fields={[
									{
										name: 'nodeList',
										type: 'multiselect',
										options: nodesArray,
										default: nodesArray,
										// disabledIds: nodesArray.map(x => x.id),
										label: 'unjoin_orderer',
										required: false,
									},
								]}
								onChange={this.onChannelChange}
							/>
							<div className="ibp-remove-orderer-confirm">
								{translate('remove_orderer_channel_confirm')}
							</div>
							<Form
								scope={SCOPE}
								id={SCOPE + '-remove'}
								fields={[
									{
										name: 'confirm_orderer_channel_name',
										tooltip: 'confirm_orderer_channel_tooltip',
										label: 'confirm_orderer_channel_name',
									},
								]}
								onChange={data => {
									this.props.updateState(SCOPE, {
										noConfirmMatch: data.confirm_orderer_channel_name !== this.props.channelInfo.name,
									});
								}}
							/>
						</div>
					</div>
				)}
			</div>
		);
	}

	render() {
		const translate = this.props.translate;
		return (
			<div>
				<SidePanel
					id="ChannelParticipationUnjoinModal"
					closed={this.props.onClose}
					buttons={[
						{
							id: 'close',
							text: translate('close'),
							onClick: this.props.onClose,
						},
						{
							id: 'unjoin',
							text: translate('unjoin_channel'),
							onClick: this.onUnjoin,
							disabled: this.props.nodeNotSelected || this.props.noConfirmMatch,
						}
					]}
					error={this.props.error}
				>
					{this.props.channelInfo && this.renderUnjoin(translate)}
				</SidePanel>
			</div>
		);
	}
}

const dataProps = {
	details: PropTypes.object,
	myNodeList: PropTypes.object,
	channelInfo: PropTypes.object,
	error: PropTypes.string,
	nodeNotSelected: PropTypes.bool,
	noConfirmMatch: PropTypes.bool,
};

ChannelParticipationUnjoinModal.propTypes = {
	...dataProps,
	onClose: PropTypes.func,
	onComplete: PropTypes.func,
	translate: PropTypes.func,
};

export default connect(
	state => {
		return Helper.mapStateToProps(state[SCOPE], dataProps);
	},
	{
		updateState,
		showError,
		clearNotifications,
	}
)(withLocalize(ChannelParticipationUnjoinModal));