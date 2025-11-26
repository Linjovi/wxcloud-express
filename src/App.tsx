import React, { useState, useEffect } from 'react';

interface CountResponse {
  code: number;
  data: number;
}

function App(): JSX.Element {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    fetch('/api/count')
      .then((res) => res.json())
      .then((data: CountResponse) => {
        if (data && data.data !== undefined) {
          setCount(data.data);
        }
      })
      .catch((err) => console.error('Error fetching count:', err));
  }, []);

  const handleCount = (action: 'inc' | 'clear'): void => {
    fetch('/api/count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ action }),
    })
      .then((res) => res.json())
      .then((data: CountResponse) => {
        if (data && data.data !== undefined) {
          setCount(data.data);
        }
      })
      .catch((err) => console.error('Error updating count:', err));
  };

  return (
    <div>
      <div className="top">
        <div className="alert">
          <svg id="error-circle" className="alert-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <g fill="none">
              <g clipPath="url(#clip0_19498_602)">
                <path d="M8.00016 2.00002C11.3139 2.00002 14.0002 4.68631 14.0002 8.00002C14.0002 11.3137 11.3139 14 8.00016 14C4.68646 14 2.00016 11.3137 2.00016 8.00002C2.00016 4.68631 4.68645 2.00002 8.00016 2.00002ZM15.3335 8.00002C15.3335 3.94993 12.0503 0.666687 8.00016 0.666688C3.95008 0.666688 0.66683 3.94993 0.666831 8.00002C0.666831 12.0501 3.95008 15.3334 8.00016 15.3334C12.0503 15.3334 15.3335 12.0501 15.3335 8.00002ZM7.3335 4.33335L7.3335 9.33335L8.66683 9.33335L8.66683 4.33335L7.3335 4.33335ZM8.66683 10.3334L7.33089 10.3334L7.33089 11.6693L8.66683 11.6693L8.66683 10.3334Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" fillOpacity="0.9"></path>
              </g>
              <defs>
                <clipPath id="clip0_19498_602">
                  <rect width="16" height="16" fill="white"></rect>
                </clipPath>
              </defs>
            </g>
          </svg>
          <span>默认域名仅支持测试使用，服务上线生产请绑定自定义域名；测试期间默认域名浏览器操作有有效时间，过期后需手动续期。</span>
        </div>
      </div>
      <div className="container">
        <div className="title">
          <img className="title-logo"
            src="https://static-index-4gtuqm3bfa95c963-1304825656.tcloudbaseapp.com/official-website/favicon.svg"
            alt="微信云托管" />
          <div style={{ display: 'inline', marginBottom: '48px' }} className="title-text">欢迎使用微信云托管</div>
        </div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 0 }}>
          <span className="count-text">
            <span style={{ marginRight: '16px' }}>当前计数:</span>
            <span className="count-number">{count}</span>
            <span className="count-reset" onClick={() => handleCount('clear')}>清零</span>
          </span>
          <button
            className="btn btn-success btn-lg count-button"
            style={{ background: '#07c160', border: 0 }}
            onClick={() => handleCount('inc')}
          >
            计数+1
          </button>
          <div className="card" style={{ width: '320px', marginBottom: '48px' }}>
            <div className="card-body">
              <img className="qrcode middle"
                src="https://qcloudimg.tencent-cloud.cn/raw/89b46988d3cd73d8a56e76a1b82bb377.png"
                alt="微信云托管用户群二维码" />
              <small className="card-text" style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                扫码加入微信云托管用户群
              </small>
            </div>
          </div>
          <div>
            <div className="hr">
              <span className="hr-text">快速入门</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <a
                className="btn btn-light btn-lg link-button"
                style={{ border: 0, boxShadow: 'none', marginRight: '12px' }}
                href="https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/basic/intro.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="24px"
                  height="24px" viewBox="0 0 24 24">
                  <title>icons_outline_warrant copy</title>
                  <g id="icons_outline_warrant-copy" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g id="0.&#x56FE;&#x6807;/&#x7EBF;&#x578B;/icons_outlined_copy">
                      <rect id="Rectangle" x="0" y="0" width="20" height="20"></rect>
                      <path
                        d="M13.9979043,2 L20,8 L20,21.0013542 C20,21.5542301 19.5541613,22 19.0041915,22 L5.99580851,22 C5.44892021,22 5,21.552891 5,21.0013542 L5,2.99864581 C5,2.44576991 5.44583866,2 5.99580851,2 L13.9979043,2 Z M12.399,3.2 L6.2,3.2 L6.2,20.8 L18.8,20.8 L18.8,9.6 L14,9.6 C13.1163444,9.6 12.4,8.8836556 12.4,8 L12.399,3.2 Z M14.2,14.4 L14.2,15.6 L7.8,15.6 L7.8,14.4 L14.2,14.4 Z M17.2,12 L17.2,13.2 L7.8,13.2 L7.8,12 L17.2,12 Z M13.599,3.299 L13.6,8 C13.6,8.2209139 13.7790861,8.4 14,8.4 L18.703,8.4 L13.599,3.299 Z"
                        id="Combined-Shape" fillOpacity="0.9" fill="#000000"></path>
                    </g>
                  </g>
                </svg>
                <span style={{ marginLeft: '4px' }}>开发者文档</span>
              </a>
              <a
                className="btn btn-light btn-lg link-button"
                style={{ border: 0, boxShadow: 'none' }}
                href="https://developers.weixin.qq.com/community/business/course/00068c2c0106c0667f5b01d015b80d"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="24px"
                  height="24px" viewBox="0 0 24 24">
                  <title>icons_outlined_play</title>
                  <g id="&#x573A;&#x666F;&#x5316;&#x90E8;&#x7F72;" stroke="none" strokeWidth="1" fill="none"
                    fillRule="evenodd">
                    <g id="icons_outlined_play">
                      <rect id="Rectangle-664" x="0" y="0" width="20" height="20"></rect>
                      <path
                        d="M12,20.8 C16.8601058,20.8 20.8,16.8601058 20.8,12 C20.8,7.1398942 16.8601058,3.2 12,3.2 C7.1398942,3.2 3.2,7.1398942 3.2,12 C3.2,16.8601058 7.1398942,20.8 12,20.8 Z M12,22 C6.4771525,22 2,17.5228475 2,12 C2,6.4771525 6.4771525,2 12,2 C17.5228475,2 22,6.4771525 22,12 C22,17.5228475 17.5228475,22 12,22 Z M10.7,14.8349028 L15.2358445,12 L10.7,9.16509717 L10.7,14.8349028 Z M10.2649995,7.47812467 L16.8216014,11.5760008 C17.0557696,11.722356 17.1269562,12.0308312 16.980601,12.2649995 C16.9403607,12.329384 16.8859859,12.3837588 16.8216014,12.4239992 L10.2649995,16.5218753 C10.0308312,16.6682305 9.72235601,16.5970439 9.57600085,16.3628756 C9.52633472,16.2834098 9.5,16.191586 9.5,16.0978762 L9.5,7.90212382 C9.5,7.62598145 9.72385763,7.40212382 10,7.40212382 C10.0937099,7.40212382 10.1855337,7.42845854 10.2649995,7.47812467 Z"
                        id="Oval-78" fillOpacity="0.9" fill="#000000"></path>
                    </g>
                  </g>
                </svg>
                <span style={{ marginLeft: '4px' }}>视频教程</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

