// https://www.jamesbaum.co.uk/blether/using-google-adsense-with-react/
import React from 'react';

declare global {
    interface Window {
	adsbygoogle:any      
    }
  }
  

export class GoogleAd extends React.Component {
	componentDidMount () {
		(window.adsbygoogle = window.adsbygoogle || []).push({});
	}

	render () {
		return (
			<div className='ad'>
				<ins className='adsbygoogle'
					style={{ display: 'block' }}
					data-ad-client='ca-pub-7349597114916756'
					data-ad-slot='6420176194'
					data-ad-format='auto' />
			</div>
		);
	}
}