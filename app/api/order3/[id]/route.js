import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const { id } = params;

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getDiscountedValue = (priceLike, percentageLike, discountLike) => {
    const discountValue = toNumber(discountLike);
    if (discountValue > 0) return discountValue;

    const priceValue = toNumber(priceLike);
    const percentageValue = toNumber(percentageLike);

    if (priceValue > 0 && percentageValue > 0) {
      return priceValue - (priceValue * percentageValue) / 100;
    }

    return priceValue;
  };

  const resolveLineItemUnitPrice = (item) => {
    if (!item) return 0;

    const colors = Array.isArray(item.color) ? item.color : [];
    const selectedColorObj = colors.find((c) => c?.color === item.selectedColor) || colors[0];

    if (selectedColorObj && Array.isArray(selectedColorObj.sizes) && selectedColorObj.sizes.length > 0) {
      const selectedSizeObj =
        selectedColorObj.sizes.find((s) => s?.size === item.selectedSize) || selectedColorObj.sizes[0];

      if (selectedSizeObj) {
        return getDiscountedValue(
          selectedSizeObj.price,
          selectedSizeObj.percentage,
          selectedSizeObj.discount
        );
      }
    }

    if (selectedColorObj) {
      return getDiscountedValue(
        selectedColorObj.price,
        selectedColorObj.percentage,
        selectedColorObj.discount
      );
    }

    return getDiscountedValue(item.price, item.percentage, item.discount);
  };

  try {
    const body = await req.json();
    const { newItem } = body;

    if (!newItem || !id) {
      return Response.json({ error: 'Missing required data' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: id },
    });

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentUserInfo = Array.isArray(order.userInfo) ? order.userInfo : [];

    const quantity = parseInt(newItem.quantity, 10);
    if (isNaN(quantity) || quantity < 1) {
      return Response.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    let productFound = false;

    const updatedUserInfo = currentUserInfo.map(item => {
      const sameId = item.id === newItem.id || item._id === newItem.id;

      // Case 1: No color or size
      if (sameId && !newItem.selectedColor && !newItem.selectedSize) {
        productFound = true;
        return {
          ...item,
          quantity: parseInt(item.quantity, 10) + quantity,
        };
      }

      // Case 2: Color only
      if (sameId && newItem.selectedColor && !newItem.selectedSize && item.selectedColor === newItem.selectedColor) {
        productFound = true;
        return {
          ...item,
          quantity: parseInt(item.quantity, 10) + quantity,
        };
      }

      // Case 3: Color and Size
      if (
        sameId &&
        newItem.selectedColor &&
        newItem.selectedSize &&
        item.selectedColor === newItem.selectedColor &&
        item.selectedSize === newItem.selectedSize
      ) {
        productFound = true;
        return {
          ...item,
          quantity: parseInt(item.quantity, 10) + quantity,
        };
      }

      // If no match, return item unchanged
      return item;
    });


    if (!productFound) {
      updatedUserInfo.push(newItem);
    }
    const unitPrice = resolveLineItemUnitPrice(newItem);
    const additionalCost = quantity * unitPrice;

    const updatedTotal = toNumber(order.total) + additionalCost;

    const updatedOrder = await prisma.order.update({
      where: { id: id },
      data: {
        userInfo: updatedUserInfo,
        total: updatedTotal.toFixed(2),
      },
    });

    return Response.json(
      { message: 'Item added to order', updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/order3/[id] error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
