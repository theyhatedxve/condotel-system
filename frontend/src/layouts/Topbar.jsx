import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  BedDouble,
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  LoaderCircle,
  Search,
  UserRound,
  WalletCards,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  searchGlobal,
} from '../api/searchApi';

import {
  useAuth,
} from '../hooks/useAuth';

import {
  formatCurrency,
} from '../utils/formatCurrency';

const resultIcons = {
  GUEST:
    UserRound,

  ROOM:
    BedDouble,

  RESERVATION:
    CalendarDays,

  PAYMENT:
    CreditCard,

  TRANSACTION:
    WalletCards,
};

function formatType(
  type,
) {
  switch (type) {
    case 'GUEST':
      return 'Guest';

    case 'ROOM':
      return 'Room';

    case 'RESERVATION':
      return 'Reservation';

    case 'PAYMENT':
      return 'Payment';

    case 'TRANSACTION':
      return 'Transaction';

    default:
      return type;
  }
}

export default function Topbar() {
  const { user } =
    useAuth();

  const navigate =
    useNavigate();

  const [
    query,
    setQuery,
  ] = useState('');

  const [
    results,
    setResults,
  ] = useState([]);

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const debounceRef =
    useRef(null);

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    return () => {
      if (
        debounceRef.current
      ) {
        clearTimeout(
          debounceRef.current,
        );
      }
    };
  }, []);

  function handleSearchChange(
    event,
  ) {
    const value =
      event.target.value;

    setQuery(value);

    if (
      debounceRef.current
    ) {
      clearTimeout(
        debounceRef.current,
      );
    }

    const normalizedValue =
      value.trim();

    if (
      normalizedValue.length <
      2
    ) {
      requestIdRef.current +=
        1;

      setResults([]);

      setSearching(
        false,
      );

      setSearchOpen(
        false,
      );

      return;
    }

    setSearching(true);

    setSearchOpen(true);

    const requestId =
      requestIdRef.current +
      1;

    requestIdRef.current =
      requestId;

    debounceRef.current =
      setTimeout(
        async () => {
          try {
            const response =
              await searchGlobal(
                normalizedValue,
              );

            if (
              requestId !==
              requestIdRef
                .current
            ) {
              return;
            }

            setResults(
              Array.isArray(
                response.results,
              )
                ? response.results
                : [],
            );
          } catch {
            if (
              requestId ===
              requestIdRef
                .current
            ) {
              setResults([]);
            }
          } finally {
            if (
              requestId ===
              requestIdRef
                .current
            ) {
              setSearching(
                false,
              );
            }
          }
        },
        300,
      );
  }

  function handleResultClick(
    result,
  ) {
    setQuery('');

    setResults([]);

    setSearchOpen(false);

    navigate(
      result.path,
    );
  }

  function handleSearchKeyDown(
    event,
  ) {
    if (
      event.key ===
      'Escape'
    ) {
      setSearchOpen(
        false,
      );
    }
  }

  return (
    <header className="topbar">
      <div
        className="topbar-search"
        onBlur={(
          event,
        ) => {
          if (
            !event.currentTarget
              .contains(
                event
                  .relatedTarget,
              )
          ) {
            setSearchOpen(
              false,
            );
          }
        }}
      >
        <Search
          size={17}
        />

        <input
          type="search"
          value={query}
          placeholder="Search guests, rooms, reservations, payments..."
          aria-label="Global search"
          onChange={
            handleSearchChange
          }
          onFocus={() => {
            if (
              query
                .trim()
                .length >= 2
            ) {
              setSearchOpen(
                true,
              );
            }
          }}
          onKeyDown={
            handleSearchKeyDown
          }
        />

        {searching && (
          <LoaderCircle
            size={16}
            className="topbar-search-spinner"
          />
        )}

        {searchOpen && (
          <div className="topbar-search-dropdown">
            <div className="topbar-search-dropdown-header">
              <span>
                Search Results
              </span>

              <small>
                {searching
                  ? 'Searching...'
                  : `${results.length} result(s)`}
              </small>
            </div>

            {!searching &&
            results.length ===
              0 ? (
              <div className="topbar-search-empty">
                No results found for
                &quot;{query}&quot;.
              </div>
            ) : (
              <div className="topbar-search-results">
                {results.map(
                  (result) => {
                    const Icon =
                      resultIcons[
                        result.type
                      ] ??
                      Search;

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        className="topbar-search-result"
                        onClick={() =>
                          handleResultClick(
                            result,
                          )
                        }
                      >
                        <div className="topbar-search-result-icon">
                          <Icon
                            size={17}
                          />
                        </div>

                        <div className="topbar-search-result-content">
                          <div className="topbar-search-result-title">
                            <strong>
                              {
                                result.title
                              }
                            </strong>

                            <span>
                              {formatType(
                                result.type,
                              )}
                            </span>
                          </div>

                          <small>
                            {
                              result.subtitle
                            }
                          </small>

                          <div className="topbar-search-result-meta">
                            {result.status && (
                              <span>
                                {
                                  result.status
                                }
                              </span>
                            )}

                            {result.amountCentavos !==
                              undefined && (
                              <span>
                                {formatCurrency(
                                  result
                                    .amountCentavos,
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-icon-button"
          aria-label="Notifications"
        >
          <Bell
            size={18}
          />
        </button>

        <button
          type="button"
          className="topbar-profile"
        >
          <div className="topbar-avatar">
            {user?.firstName
              ?.charAt(0)
              ?.toUpperCase() ||
              'A'}
          </div>

          <span>
            {user?.firstName ||
              'Admin'}
          </span>

          <ChevronDown
            size={15}
          />
        </button>
      </div>
    </header>
  );
}