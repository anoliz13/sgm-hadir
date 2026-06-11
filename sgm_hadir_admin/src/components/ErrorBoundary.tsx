import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">Terjadi Kesalahan</h1>
            <p className="page-subtitle">
              Mohon maaf, terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.
            </p>
          </div>
          <div className="card">
            <div className="empty-state" style={{ padding: "60px 24px" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  margin: "0 auto 20px",
                  background: "#FEF2F2",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                }}
              >
                ⚠️
              </div>
              <p className="empty-state-title">Something went wrong</p>
              <p className="empty-state-desc" style={{ marginBottom: "24px" }}>
                {this.state.error?.message || "Unknown error"}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
