/**
 * Khu vườn ban ngày.
 *
 * Đồi cỏ, bụi cây và cây hoa đào vẽ bằng SVG, hoa cỏ bằng gradient lặp, chim
 * và ong bướm là những phần tử nhỏ bay qua bay lại. Vị trí, tốc độ và luật
 * hiện/ẩn theo tiến độ nằm hết trong `src/styles/scene.css` — ở đây chỉ có hình.
 *
 * Bụi cây, cây xa và chim nằm ngoài `.scene-band` nên trải hết bề ngang: trên
 * màn hình rộng, nếu mọi thứ đều bó trong cột nội dung thì hai bên trống trơn.
 */
export function GardenScene() {
  return (
    <>
      <div className="scene-sky" />
      <div className="scene-sun">
        <div className="scene-sun-disc" />
      </div>

      <div className="scene-cloud scene-cloud--1">
        <span />
        <span />
        <span />
      </div>
      <div className="scene-cloud scene-cloud--2">
        <span />
        <span />
        <span />
      </div>
      <div className="scene-cloud scene-cloud--3">
        <span />
        <span />
        <span />
      </div>

      <Bird index={1} />
      <Bird index={2} />
      <Bird index={3} />

      {/* Sáu lớp đồi. Lớp bị kéo giãn theo bề ngang màn hình nên chỉ chứa những
          nét trừu tượng — cây cối vẽ trong đây sẽ bẹt ra trên màn hình rộng. */}
      <svg className="scene-hills" viewBox="0 0 390 360" preserveAspectRatio="none">
        <path d="M0 96C64 70 126 92 196 70 266 48 320 76 390 58V360H0Z" fill="#cbe3ea" />
        <path d="M0 132C70 104 140 126 210 102 280 78 332 108 390 90V360H0Z" fill="#b0d7dd" />
        <path d="M0 168C62 136 112 156 172 132 232 108 302 144 390 118V360H0Z" fill="#a4d3b2" />
        <path d="M0 212C72 184 122 202 192 182 262 162 330 192 390 174V360H0Z" fill="#84c78a" />
        <path d="M0 262C80 238 152 256 232 242 302 230 352 248 390 238V360H0Z" fill="#63b167" />
        <path d="M0 312C74 296 140 308 214 300 288 292 340 302 390 296V360H0Z" fill="#4e9e55" />
      </svg>

      <Shrub index={1} />
      <Shrub index={2} />
      <Shrub index={3} />
      <Shrub index={4} />

      <FarTree index={1} />
      <FarTree index={2} />
      <FarTree index={3} />
      <FarTree index={4} />
      <FarTree index={5} />

      <div className="scene-flowers scene-flowers--1" />
      <div className="scene-flowers scene-flowers--2" />

      <div className="scene-band">
        {/* Thân cây cố ý ngắn: trên điện thoại, cột nội dung chiếm gần hết bề
            ngang, nên khoảng trống duy nhất để khoe hoa là dải cỏ sát đáy màn
            hình. Cây mọc từ mép dưới lên, tán nằm gọn trong dải đó. */}
        <svg className="scene-tree scene-tree--main" viewBox="0 0 250 360">
          <path
            d="M126 360V196M126 232c-20-12-31-30-36-52M126 206c18-11 29-27 34-47"
            fill="none"
            stroke="#7a5442"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <g className="scene-canopy" opacity=".95">
            <circle cx="114" cy="150" r="58" fill="#f6a7c4" />
            <circle cx="60" cy="172" r="44" fill="#f9bcd2" />
            <circle cx="168" cy="170" r="42" fill="#f9bcd2" />
            <circle cx="130" cy="92" r="42" fill="#fbc9db" />
            <circle cx="74" cy="112" r="32" fill="#f6a7c4" />
            <circle cx="176" cy="116" r="28" fill="#fdd7e4" />
            <circle cx="104" cy="200" r="28" fill="#f08fb4" />
            <circle cx="156" cy="208" r="22" fill="#fbc9db" />
          </g>
        </svg>

        {/* Cây thứ hai là phần thưởng cho streak — CSS giữ nó ẩn cho tới lúc đó. */}
        <svg className="scene-tree scene-tree--second" viewBox="0 0 140 230">
          <path
            d="M70 230V118M70 146c-13-8-20-19-24-33"
            fill="none"
            stroke="#7a5442"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <g className="scene-canopy" opacity=".9">
            <circle cx="66" cy="92" r="36" fill="#f6a7c4" />
            <circle cx="30" cy="110" r="24" fill="#fbc9db" />
            <circle cx="102" cy="108" r="22" fill="#fbc9db" />
            <circle cx="74" cy="54" r="24" fill="#fdd7e4" />
          </g>
        </svg>

        <div className="scene-petal scene-petal--1" />
        <div className="scene-petal scene-petal--2" />
        <div className="scene-petal scene-petal--3" />
        <div className="scene-petal scene-petal--4" />
        <div className="scene-petal scene-petal--5" />
        <div className="scene-petal scene-petal--6" />

        <Flyer path="a" bob="a">
          <Butterfly size={24} wing="#ff8fb8" wingLight="#ffc7de" body="#5a3b52" />
        </Flyer>
        <Flyer path="b" bob="b">
          <Butterfly size={20} wing="#ffcb70" wingLight="#ffe9c2" body="#6b4a2a" />
        </Flyer>
        <Flyer path="c" bob="c">
          <Butterfly size={17} wing="#bda4f2" wingLight="#e6dbff" body="#4b3b6b" />
        </Flyer>
        <Flyer path="d" bob="d" facing>
          <Bee size={20} />
        </Flyer>
        <Flyer path="e" bob="e" facing>
          <Bee size={16} />
        </Flyer>
      </div>
    </>
  )
}

/**
 * Một con vật đang bay.
 *
 * Ba lớp lồng nhau, mỗi lớp một chuyển động, để đường bay cong mà chỉ tốn ba
 * animation đơn giản: sweep ngang → nhịp lên xuống → quay mặt.
 * `facing` chỉ dành cho con có đầu: bướm đối xứng nên lật cũng như không.
 */
function Flyer({
  path,
  bob,
  facing = false,
  children,
}: {
  path: 'a' | 'b' | 'c' | 'd' | 'e'
  bob: 'a' | 'b' | 'c' | 'd' | 'e'
  facing?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`scene-fly scene-fly--${path}`}>
      <div className={`scene-bob scene-bob--${bob}`}>
        {facing ? <div className="scene-face">{children}</div> : children}
      </div>
    </div>
  )
}

function Butterfly({
  size,
  wing,
  wingLight,
  body,
}: {
  size: number
  wing: string
  wingLight: string
  body: string
}) {
  return (
    <svg viewBox="0 0 24 18" width={size} height={(size * 18) / 24}>
      <g className="scene-wing">
        <path d="M12 9C9 1 2 1 2 7c0 5 7 6 10 2Z" fill={wing} />
        <path d="M12 9c3-8 10-8 10-2 0 5-7 6-10 2Z" fill={wingLight} />
      </g>
      <path d="M12 4.5v9" stroke={body} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Bee({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 26 18" width={size} height={(size * 18) / 26}>
      <ellipse cx="15" cy="10.5" rx="6.4" ry="4.6" fill="#f5b83d" />
      <path d="M13 6.4v8.2M16.6 6.8v7.4" stroke="#3b2a12" strokeWidth="1.7" />
      <circle cx="7.4" cy="9.8" r="2.8" fill="#3b2a12" />
      <g className="scene-wing">
        <ellipse cx="14" cy="5" rx="4.6" ry="2.4" fill="rgba(255,255,255,.85)" />
      </g>
    </svg>
  )
}

/** Một con chim ở xa: chỉ là hai nét cánh, nhưng đập cánh nên nhìn ra là chim. */
function Bird({ index }: { index: 1 | 2 | 3 }) {
  return (
    <div className={`scene-bird scene-bird--${index}`}>
      <svg viewBox="0 0 24 12" width="20" height="10">
        <path
          className="scene-wingbeat"
          d="M2 8c3.4 0 4.6-5 6.6-5s3.2 5 6.6 5"
          fill="none"
          stroke="rgba(58,80,70,.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

/** Bụi cây thấp ven chân đồi. */
function Shrub({ index }: { index: 1 | 2 | 3 | 4 }) {
  return (
    <svg className={`scene-shrub scene-shrub--${index}`} viewBox="0 0 100 50">
      <ellipse cx="30" cy="38" rx="26" ry="18" fill="#3f8c48" />
      <ellipse cx="62" cy="34" rx="22" ry="20" fill="#4b9c53" />
      <ellipse cx="82" cy="40" rx="17" ry="13" fill="#3f8c48" />
    </svg>
  )
}

/** Cây ở xa: chỉ một tán tròn và một thân mảnh, đủ để có chiều sâu. */
function FarTree({ index }: { index: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <svg className={`scene-fartree scene-fartree--${index}`} viewBox="0 0 40 64">
      <path d="M20 64V40" stroke="#6d5140" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="20" cy="26" r="15" fill="#4f9d58" />
      <circle cx="10" cy="34" r="10" fill="#5aa962" />
      <circle cx="30" cy="33" r="9" fill="#5aa962" />
    </svg>
  )
}
