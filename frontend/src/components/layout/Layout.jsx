import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, title, violationCount = 0 }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Header title={title} violationCount={violationCount} />
        <main className="page-content fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
