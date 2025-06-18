import React, { useState, Children } from "react";
import { ListGroup, Pagination } from "react-bootstrap";

const PaginatedListGroup = ({
  children,
  itemsPerPage,
  variant,
  maxButtons = 3,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const numItems = Children.count(children); // Number of list items
  const numPages = Math.ceil(numItems / itemsPerPage); // Number of pages to display them all

  const firstItem = (currentPage - 1) * itemsPerPage;
  const itemsOnScreen = Children.toArray(children).slice(
    firstItem,
    firstItem + itemsPerPage,
  );

  const arrayRange = (start, end) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageButtons = () => {
    // If fewer pages than the max, just display buttons for all of them
    if (numPages <= maxButtons) {
      return arrayRange(1, numPages).map((page) => (
        <Pagination.Item
          key={page}
          active={page == currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      ));
    }
    // Otherwise, show some either side and then ellipses
    const buttons = [];
    const lowPage = Math.max(1, currentPage - Math.floor((maxButtons - 1) / 2));
    const highPage = Math.min(
      numPages,
      currentPage + Math.floor((maxButtons - 1) / 2),
    );
    // Show ellipses buttons as necessary
    if (lowPage > 1) buttons.push(<Pagination.Ellipsis key="ellipsis-low" />);
    buttons.push(
      arrayRange(lowPage, highPage).map((page) => (
        <Pagination.Item
          key={page}
          active={page == currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      )),
    );
    if (highPage < numPages)
      buttons.push(<Pagination.Ellipsis key="ellipsis-high" />);
    return buttons;
  };

  return (
    <>
      <ListGroup variant={variant}>{itemsOnScreen}</ListGroup>

      {numPages > 1 && (
        <Pagination className="mt-3 justify-content-center">
          <Pagination.First
            disabled={currentPage == 1}
            onClick={() => setCurrentPage(1)}
          />
          {pageButtons()}
          <Pagination.Last
            disabled={currentPage == numPages}
            onClick={() => setCurrentPage(numPages)}
          />
        </Pagination>
      )}
    </>
  );
};

export default PaginatedListGroup;
