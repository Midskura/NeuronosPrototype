import clsx from "clsx";
type HeadingProps = {
  additionalClassNames?: string;
};

function Heading({ children, additionalClassNames = "" }: React.PropsWithChildren<HeadingProps>) {
  return (
    <div className={clsx("absolute h-[20px] left-0", additionalClassNames)}>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[14px] top-[10px] tracking-[0.7px] uppercase whitespace-nowrap">
        <p className="leading-[20px]">{children}</p>
      </div>
    </div>
  );
}
type ContainerText1Props = {
  text: string;
};

function ContainerText1({ text }: ContainerText1Props) {
  return (
    <div className="absolute h-[28px] left-[287.28px] top-0 w-[23.55px]">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] justify-center leading-[0] left-0 not-italic text-[18px] text-white top-[14px] tracking-[-0.45px] w-[23.55px]">
        <p className="leading-[28px]">{text}</p>
      </div>
    </div>
  );
}
type ContainerTextProps = {
  text: string;
  additionalClassNames?: string;
};

function ContainerText({ text, additionalClassNames = "" }: ContainerTextProps) {
  return (
    <div className={clsx("absolute h-[20px]", additionalClassNames)}>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[14px] top-[10px] whitespace-nowrap">
        <p className="leading-[20px]">{text}</p>
      </div>
    </div>
  );
}

export default function MainContainerForTheDashboardCard() {
  return (
    <div className="bg-[#1e1e1e] border border-[#303035] border-solid overflow-clip relative rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] size-full" data-name="Main container for the dashboard card">
      <div className="absolute h-[328px] left-[32px] top-[40px] w-[678.28px]" data-name="Left Section - P&L Trend Chart">
        <div className="absolute h-[68px] left-0 top-0 w-[678.28px]" data-name="Chart Header: Title, Controls, Legend:margin">
          <div className="absolute h-[36px] left-0 top-0 w-[678.28px]" data-name="Chart Header: Title, Controls, Legend">
            <Heading additionalClassNames="top-[8px] w-[83.17px]">{`P&L Trend`}</Heading>
            <div className="absolute bg-[#27272a] h-[36px] left-[192.6px] rounded-[8px] top-0 w-[203.05px]" data-name="Segmented Control for Time Period">
              <div className="absolute bg-[#52525b] h-[28px] left-[4px] rounded-[6px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] top-[4px] w-[53.61px]" data-name="Button">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] left-[26.81px] not-italic text-[14px] text-center text-white top-[14px] w-[21.61px]">
                  <p className="leading-[20px]">6M</p>
                </div>
              </div>
              <div className="absolute h-[28px] left-[61.61px] top-[4px] w-[59.22px]" data-name="Button">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] left-[29.61px] not-italic text-[#9ca3af] text-[14px] text-center top-[14px] w-[27.22px]">
                  <p className="leading-[20px]">12M</p>
                </div>
              </div>
              <div className="absolute h-[16px] left-[124.83px] top-[10px] w-[9px]" data-name="Margin">
                <div className="absolute bg-[rgba(255,255,255,0.1)] h-[16px] left-[4px] top-0 w-px" data-name="Vertical Divider" />
              </div>
              <div className="absolute h-[28px] left-[137.83px] top-[4px] w-[61.22px]" data-name="Button">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] left-[30.61px] not-italic text-[#9ca3af] text-[14px] text-center top-[14px] w-[29.22px]">
                  <p className="leading-[20px]">YTD</p>
                </div>
              </div>
            </div>
            <div className="absolute h-[20px] left-[505.08px] top-[8px] w-[173.2px]" data-name="Legend">
              <div className="absolute h-[20px] left-0 top-0 w-[75.17px]" data-name="Container">
                <div className="absolute bg-[#0ea5e9] left-0 rounded-[9999px] size-[10px] top-[5px]" data-name="Background" />
                <ContainerText text="Revenue" additionalClassNames="left-[18px] top-0 w-[57.17px]" />
              </div>
              <div className="absolute h-[20px] left-[91.18px] top-0 w-[82.02px]" data-name="Container">
                <div className="absolute bg-[#ec4899] left-0 rounded-[9999px] size-[10px] top-[5px]" data-name="Background" />
                <ContainerText text="Expenses" additionalClassNames="left-[18px] top-0 w-[64.02px]" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute h-[300px] left-0 top-[68px] w-[678.28px]" data-name="Chart Visualization Area">
          <div className="absolute h-[300px] left-0 top-0 w-[678.28px]" data-name="Y-Axis Labels & Grid Lines Container">
            <div className="absolute h-[32px] left-0 top-0 w-[678.28px]" data-name="Row 1">
              <div className="absolute h-[32px] left-0 top-0 w-[80px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[32px] justify-center leading-[16px] left-[64px] not-italic text-[#9ca3af] text-[12px] text-right top-[16px] w-[40.5px]">
                  <p className="mb-0">PHP</p>
                  <p>250.0K</p>
                </div>
              </div>
              <div className="absolute bg-[#1f2937] h-px left-[80px] top-[15.5px] w-[598.28px]" data-name="Horizontal Divider" />
            </div>
            <div className="absolute h-[32px] left-0 top-[53.59px] w-[678.28px]" data-name="Row 2">
              <div className="absolute h-[32px] left-0 top-0 w-[80px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[32px] justify-center leading-[16px] left-[64px] not-italic text-[#9ca3af] text-[12px] text-right top-[16px] w-[40.95px]">
                  <p className="mb-0">PHP</p>
                  <p>200.0K</p>
                </div>
              </div>
              <div className="absolute bg-[#1f2937] h-px left-[80px] top-[15.5px] w-[598.28px]" data-name="Horizontal Divider" />
            </div>
            <div className="absolute h-[32px] left-0 top-[107.19px] w-[678.28px]" data-name="Row 3">
              <div className="absolute h-[32px] left-0 top-0 w-[80px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[32px] justify-center leading-[16px] left-[64px] not-italic text-[#9ca3af] text-[12px] text-right top-[16px] w-[38.06px]">
                  <p className="mb-0">PHP</p>
                  <p>150.0K</p>
                </div>
              </div>
              <div className="absolute bg-[#1f2937] h-px left-[80px] top-[15.5px] w-[598.28px]" data-name="Horizontal Divider" />
            </div>
            <div className="absolute h-[32px] left-0 top-[160.78px] w-[678.28px]" data-name="Row 4">
              <div className="absolute h-[32px] left-0 top-0 w-[80px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[32px] justify-center leading-[16px] left-[64px] not-italic text-[#9ca3af] text-[12px] text-right top-[16px] w-[38.52px]">
                  <p className="mb-0">PHP</p>
                  <p>100.0K</p>
                </div>
              </div>
              <div className="absolute bg-[#1f2937] h-px left-[80px] top-[15.5px] w-[598.28px]" data-name="Horizontal Divider" />
            </div>
            <div className="absolute h-[16px] left-0 top-[214.38px] w-[678.28px]" data-name="Row 5">
              <div className="absolute h-[16px] left-0 top-0 w-[80px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] left-[64px] not-italic text-[#9ca3af] text-[12px] text-right top-[8px] w-[60.8px]">
                  <p className="leading-[16px]">PHP 50.0K</p>
                </div>
              </div>
              <div className="absolute bg-[#1f2937] h-px left-[80px] top-[7.5px] w-[598.28px]" data-name="Horizontal Divider" />
            </div>
            <div className="absolute h-[16px] left-0 top-[251.97px] w-[678.28px]" data-name="Row 6">
              <div className="absolute h-[16px] left-0 top-0 w-[80px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-[63.8px] not-italic text-[#9ca3af] text-[12px] text-right top-[8px] whitespace-nowrap">
                  <p className="leading-[16px]">PHP 0</p>
                </div>
              </div>
              <div className="absolute bg-[#1f2937] h-px left-[80px] top-[7.5px] w-[598.28px]" data-name="Horizontal Divider" />
            </div>
          </div>
          <div className="absolute h-[300px] left-[80px] top-0 w-[598.28px]" data-name="Placed over the grid lines, pushed right to align with grid lines (skipping Y-axis labels space)">
            <div className="absolute h-[252px] left-0 top-[16px] w-[99.713px]" data-name="Month: Oct">
              <div className="absolute h-[220px] left-0 top-0 w-[99.713px]" data-name="Container">
                <div className="absolute bg-[#0ea5e9] h-[187px] left-[15.86px] rounded-tl-[6px] rounded-tr-[6px] top-[33px] w-[32px]" data-name="Revenue Bar" />
                <div className="absolute bg-[#ec4899] h-[132px] left-[51.86px] rounded-tl-[6px] rounded-tr-[6px] top-[88px] w-[32px]" data-name="Expenses Bar" />
              </div>
              <div className="absolute h-[24px] left-[39.87px] top-[228px] w-[19.97px]" data-name="Margin">
                <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[12px] top-[16px] w-[19.97px]">
                  <p className="leading-[16px]">Oct</p>
                </div>
              </div>
            </div>
            <div className="absolute h-[252px] left-[99.71px] top-[16px] w-[99.713px]" data-name="Month: Nov">
              <div className="absolute h-[220px] left-0 top-0 w-[99.713px]" data-name="Container">
                <div className="absolute bg-[#0ea5e9] h-[165px] left-[15.86px] rounded-tl-[6px] rounded-tr-[6px] top-[55px] w-[32px]" data-name="Revenue Bar" />
                <div className="absolute bg-[#ec4899] h-[132px] left-[51.86px] rounded-tl-[6px] rounded-tr-[6px] top-[88px] w-[32px]" data-name="Expenses Bar" />
              </div>
              <div className="absolute h-[24px] left-[38.48px] top-[228px] w-[22.75px]" data-name="Margin">
                <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[12px] top-[16px] w-[22.75px]">
                  <p className="leading-[16px]">Nov</p>
                </div>
              </div>
            </div>
            <div className="absolute h-[252px] left-[199.43px] top-[16px] w-[99.713px]" data-name="Month: Dec">
              <div className="absolute h-[220px] left-0 top-0 w-[99.713px]" data-name="Container">
                <div className="absolute bg-[#0ea5e9] h-[180.39px] left-[15.86px] rounded-tl-[6px] rounded-tr-[6px] top-[39.61px] w-[32px]" data-name="Revenue Bar" />
                <div className="absolute bg-[#ec4899] h-[140.8px] left-[51.86px] rounded-tl-[6px] rounded-tr-[6px] top-[79.2px] w-[32px]" data-name="Expenses Bar" />
              </div>
              <div className="absolute h-[24px] left-[38.6px] top-[228px] w-[22.52px]" data-name="Margin">
                <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[12px] top-[16px] w-[22.52px]">
                  <p className="leading-[16px]">Dec</p>
                </div>
              </div>
            </div>
            <div className="absolute h-[252px] left-[299.14px] top-[16px] w-[99.713px]" data-name="Month: Jan">
              <div className="absolute h-[220px] left-0 top-0 w-[99.713px]" data-name="Container">
                <div className="absolute bg-[#0ea5e9] h-[176px] left-[15.86px] rounded-tl-[6px] rounded-tr-[6px] top-[44px] w-[32px]" data-name="Revenue Bar" />
                <div className="absolute bg-[#ec4899] h-[121px] left-[51.86px] rounded-tl-[6px] rounded-tr-[6px] top-[99px] w-[32px]" data-name="Expenses Bar" />
              </div>
              <div className="absolute h-[24px] left-[39.51px] top-[228px] w-[20.69px]" data-name="Margin">
                <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[12px] top-[16px] w-[20.69px]">
                  <p className="leading-[16px]">Jan</p>
                </div>
              </div>
            </div>
            <div className="absolute h-[252px] left-[398.85px] top-[16px] w-[99.713px]" data-name="Month: Feb">
              <div className="absolute h-[220px] left-0 top-0 w-[99.713px]" data-name="Container">
                <div className="absolute bg-[#0ea5e9] h-[140.8px] left-[15.86px] rounded-tl-[6px] rounded-tr-[6px] top-[79.2px] w-[32px]" data-name="Revenue Bar" />
                <div className="absolute bg-[#ec4899] h-[99px] left-[51.86px] rounded-tl-[6px] rounded-tr-[6px] top-[121px] w-[32px]" data-name="Expenses Bar" />
              </div>
              <div className="absolute h-[24px] left-[39.38px] top-[228px] w-[20.95px]" data-name="Margin">
                <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[12px] top-[16px] w-[20.95px]">
                  <p className="leading-[16px]">Feb</p>
                </div>
              </div>
            </div>
            <div className="absolute h-[252px] left-[498.57px] top-[16px] w-[99.713px]" data-name="Month: Mar">
              <div className="absolute h-[220px] left-0 top-0 w-[99.713px]" data-name="Container">
                <div className="absolute bg-[#0ea5e9] h-[182.59px] left-[15.86px] rounded-tl-[6px] rounded-tr-[6px] top-[37.41px] w-[32px]" data-name="Revenue Bar" />
                <div className="absolute bg-[#ec4899] h-[107.8px] left-[51.86px] rounded-tl-[6px] rounded-tr-[6px] top-[112.2px] w-[32px]" data-name="Expenses Bar" />
              </div>
              <div className="absolute h-[24px] left-[38.8px] top-[228px] w-[22.11px]" data-name="Margin">
                <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[12px] top-[16px] whitespace-nowrap">
                  <p className="leading-[16px]">Mar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute h-[328px] left-[742.28px] top-[40px] w-[64.89px]" data-name="Margin">
        <div className="absolute bg-[#27272a] h-[296px] left-[32px] top-[16px] w-[0.89px]" data-name="Vertical Divider" />
      </div>
      <div className="absolute h-[328px] left-[839.17px] top-[40px] w-[342.83px]" data-name="Right Section - Cash Flow Summary">
        <div className="absolute h-[44px] left-[32px] top-0 w-[310.83px]" data-name="Heading 2:margin">
          <Heading additionalClassNames="top-0 w-[310.83px]">Cash Flow Summary</Heading>
        </div>
        <div className="absolute h-[284px] left-[32px] top-[44px] w-[310.83px]" data-name="Container">
          <div className="absolute h-[28px] left-0 top-0 w-[310.83px]" data-name="Item 1: Revenue">
            <ContainerText text="Revenue" additionalClassNames="left-0 top-[4px] w-[57.17px]" />
            <ContainerText1 text="₱0" />
          </div>
          <div className="absolute h-[28px] left-0 top-[52px] w-[310.83px]" data-name="Item 2: Expenses">
            <ContainerText text="Expenses" additionalClassNames="left-0 top-[4px] w-[64.02px]" />
            <ContainerText1 text="₱0" />
          </div>
          <div className="absolute h-[44px] left-0 top-[104px] w-[310.83px]" data-name="Item 3: Net Profit">
            <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[14px] top-[15px] w-[62.77px]">
              <p className="leading-[20px]">Net Profit</p>
            </div>
            <div className="absolute h-[44px] left-[238.75px] top-0 w-[72.08px]" data-name="Container">
              <div className="absolute h-[28px] left-0 top-0 w-[72.08px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] justify-center leading-[0] left-[72.08px] not-italic text-[18px] text-right text-white top-[14px] tracking-[-0.45px] w-[23.55px]">
                  <p className="leading-[28px]">₱0</p>
                </div>
              </div>
              <div className="absolute h-[16px] left-0 top-[28px] w-[72.08px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-[72px] not-italic text-[#6b7280] text-[12px] text-right top-[8px] whitespace-nowrap">
                  <p className="leading-[16px]">0.0% margin</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute h-[44px] left-0 top-[172px] w-[310.83px]" data-name="Item 4: Collected">
            <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[14px] top-[15px] w-[62.75px]">
              <p className="leading-[20px]">Collected</p>
            </div>
            <div className="absolute h-[44px] left-[225.46px] top-0 w-[85.38px]" data-name="Container">
              <div className="absolute h-[28px] left-0 top-0 w-[85.38px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] justify-center leading-[0] left-[85.38px] not-italic text-[18px] text-right text-white top-[14px] tracking-[-0.45px] w-[71.5px]">
                  <p className="leading-[28px]">₱117,700</p>
                </div>
              </div>
              <div className="absolute h-[16px] left-0 top-[28px] w-[85.38px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] left-[85px] not-italic text-[#6b7280] text-[12px] text-right top-[8px] whitespace-nowrap">
                  <p className="leading-[16px]">0% of invoiced</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute h-[44px] left-0 top-[240px] w-[310.83px]" data-name="Item 5: Net Cash">
            <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[20px] justify-center leading-[0] left-0 not-italic text-[#9ca3af] text-[14px] top-[15px] w-[60.98px]">
              <p className="leading-[20px]">Net Cash</p>
            </div>
            <div className="absolute h-[44px] left-[189.44px] top-0 w-[121.39px]" data-name="Container">
              <div className="absolute h-[28px] left-0 top-0 w-[121.39px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold h-[28px] justify-center leading-[0] left-[121.39px] not-italic text-[18px] text-right text-white top-[14px] tracking-[-0.45px] w-[71.5px]">
                  <p className="leading-[28px]">₱117,700</p>
                </div>
              </div>
              <div className="absolute h-[16px] left-0 top-[28px] w-[121.39px]" data-name="Container">
                <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] left-[121.39px] not-italic text-[#6b7280] text-[12px] text-right top-[8px] w-[121.39px]">
                  <p className="leading-[16px]">Collected – Expenses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}