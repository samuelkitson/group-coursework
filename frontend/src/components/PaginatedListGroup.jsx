import React, { useState, Children, useMemo, useEffect } from "react";
import { ListGroup, Pagination, InputGroup, FormControl, Button } from "react-bootstrap";

const PaginatedListGroup = ({
  children,
  itemsPerPage,
  variant,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [responsiveMaxButtons, setResponsiveMaxButtons] = useState(3);

  //  Adjust the number of buttons to show based on screen width.
  useEffect(() => {
    const updateButtonCount = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setResponsiveMaxButtons(7);
      } else if (width >= 992) {
        setResponsiveMaxButtons(4);
      } else if (width >= 576) {
        setResponsiveMaxButtons(2);
      } else {
        setResponsiveMaxButtons(1);
      }
    };

    updateButtonCount();
    window.addEventListener("resize", updateButtonCount);
    return () => window.removeEventListener("resize", updateButtonCount);
  }, []);

  // Filter items based on search term.
  const filteredChildren = useMemo(() => {
    if (!searchTerm.trim()) return Children.toArray(children);
    
    return Children.toArray(children).filter(child => {
      // Extract text content from the child element for searching.
      const getTextContent = (element) => {
        if (typeof element === "string") return element;
        if (typeof element === "number") return element.toString();
        if (React.isValidElement(element)) {
          if (element.props.children) {
            if (Array.isArray(element.props.children)) {
              return element.props.children.map(getTextContent).join(" ");
            }
            return getTextContent(element.props.children);
          }
        }
        return '';
      };

      const text = getTextContent(child).toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });
  }, [children, searchTerm]);

  const numItems = filteredChildren.length;
  const numPages = Math.ceil(numItems / itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  // Ensure current page doesn't exceed available pages.
  useEffect(() => {
    if (currentPage > numPages && numPages > 0) {
      setCurrentPage(numPages);
    }
  }, [numPages, currentPage]);

  const firstItem = (currentPage - 1) * itemsPerPage;
  const itemsOnScreen = filteredChildren.slice(
    firstItem,
    firstItem + itemsPerPage,
  );

  const arrayRange = (start, end) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageButtons = () => {
    if (numPages <= 1) return [];

    // If fewer pages than the responsive max, just display buttons for all of them.
    if (numPages <= responsiveMaxButtons) {
      return arrayRange(1, numPages).map((page) => (
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      ));
    }

    // When there are more pages, calculate more advanced pagination button
    // positions.
    const buttons = [];
    const halfButtons = Math.floor(responsiveMaxButtons / 2);
    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(numPages, currentPage + halfButtons);

    // Adjustment if near the beginning or end of the list.
    if (endPage - startPage + 1 < responsiveMaxButtons) {
      if (startPage === 1) {
        endPage = Math.min(numPages, startPage + responsiveMaxButtons - 1);
      } else if (endPage === numPages) {
        startPage = Math.max(1, endPage - responsiveMaxButtons + 1);
      }
    }

    // Show first page and ellipsis if needed.
    if (startPage > 1) {
      buttons.push(
        <Pagination.Item
          key={1}
          active={1 === currentPage}
          onClick={() => setCurrentPage(1)}
        >
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        buttons.push(<Pagination.Ellipsis key="ellipsis-low" />);
      }
    }

    // Show the main range of buttons.
    buttons.push(
      ...arrayRange(startPage, endPage).map((page) => (
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      ))
    );

    // Show last page and ellipsis if needed.
    if (endPage < numPages) {
      if (endPage < numPages - 1) {
        buttons.push(<Pagination.Ellipsis key="ellipsis-high" />);
      }
      buttons.push(
        <Pagination.Item
          key={numPages}
          active={numPages === currentPage}
          onClick={() => setCurrentPage(numPages)}
        >
          {numPages}
        </Pagination.Item>
      );
    }

    return buttons;
  };

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(numPages, prev + 1));
  };

  return (
    <>
      <div className="bg-light p-2 mb-0 border-0 rounded">
        <InputGroup>
          <FormControl
            placeholder="Search list..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            aria-label="Search list"
            className="border-0 shadow-sm"
          />
          <Button 
            variant="primary" 
            onClick={handleSearch}
            disabled={searchInput === searchTerm}
            className="shadow-sm"
          >
            Search
          </Button>
          {searchTerm && (
            <Button 
              variant="outline-secondary" 
              onClick={clearSearch}
              className="shadow-sm"
            >
              Clear
            </Button>
          )}
        </InputGroup>
      </div>

      {searchTerm && (
        <div className="mx-2 my-2 text-muted small">
          {`${numItems} result${numItems !== 1 ? "s" : ""} found`}
        </div>
      )}

      <ListGroup variant={variant}>
        {itemsOnScreen.length > 0 ? itemsOnScreen : (
          <ListGroup.Item className="text-muted text-center">
            Nothing to display
          </ListGroup.Item>
        )}
      </ListGroup>

      {numPages > 1 && (
        <Pagination className="mt-3 justify-content-center flex-wrap">
          <Pagination.First
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          />
          <Pagination.Prev
            disabled={currentPage === 1}
            onClick={handlePrevious}
          />
          {pageButtons()}
          <Pagination.Next
            disabled={currentPage === numPages}
            onClick={handleNext}
          />
          <Pagination.Last
            disabled={currentPage === numPages}
            onClick={() => setCurrentPage(numPages)}
          />
        </Pagination>
      )}
    </>
  );
};

export default PaginatedListGroup;
